import {
  WALLET_SETTLEMENT_EXCHANGE,
  type BetDebitConfirmedEvent,
  type BetDebitRejectedEvent,
  type CashoutCreditConfirmedEvent,
  type CashoutCreditRejectedEvent,
  type WalletSettlementEvent,
} from "@crash/contracts"
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib"
import { HandleBetDebitConfirmedEventService } from "../../application/handle-bet-debit-confirmed-event.service"
import { HandleBetDebitRejectedEventService } from "../../application/handle-bet-debit-rejected-event.service"
import { HandleCashoutCreditConfirmedEventService } from "../../application/handle-cashout-credit-confirmed-event.service"
import { HandleCashoutCreditRejectedEventService } from "../../application/handle-cashout-credit-rejected-event.service"
import type { SettlementEventPublisher } from "../../application/settlement-events.publisher"

const BET_DEBIT_CONFIRMED_QUEUE = "games.bet-debit-confirmed"
const BET_DEBIT_REJECTED_QUEUE = "games.bet-debit-rejected"
const CASHOUT_CREDIT_CONFIRMED_QUEUE = "games.cashout-credit-confirmed"
const CASHOUT_CREDIT_REJECTED_QUEUE = "games.cashout-credit-rejected"

@Injectable()
export class RabbitMqGamesSettlementIntegration
  implements SettlementEventPublisher, OnModuleInit, OnModuleDestroy
{
  private channel: Channel | null = null
  private connection: ChannelModel | null = null

  constructor(
    private readonly handleBetDebitConfirmedEvent: HandleBetDebitConfirmedEventService,
    private readonly handleBetDebitRejectedEvent: HandleBetDebitRejectedEventService,
    private readonly handleCashoutCreditConfirmedEvent: HandleCashoutCreditConfirmedEventService,
    private readonly handleCashoutCreditRejectedEvent: HandleCashoutCreditRejectedEventService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rabbitMqUrl = process.env.RABBITMQ_URL

    if (!rabbitMqUrl) {
      throw new Error("RABBITMQ_URL is required for games settlement integration.")
    }

    this.connection = await connect(rabbitMqUrl)
    this.channel = await this.connection.createChannel()

    await this.channel.assertExchange(WALLET_SETTLEMENT_EXCHANGE, "topic", {
      durable: true,
    })

    await this.assertAndConsumeQueue(
      BET_DEBIT_CONFIRMED_QUEUE,
      "bet.debit.confirmed",
      async (message) => {
        await this.handleBetDebitConfirmedEvent.execute(
          this.parseEvent<BetDebitConfirmedEvent>(message),
        )
      },
    )
    await this.assertAndConsumeQueue(
      BET_DEBIT_REJECTED_QUEUE,
      "bet.debit.rejected",
      async (message) => {
        await this.handleBetDebitRejectedEvent.execute(
          this.parseEvent<BetDebitRejectedEvent>(message),
        )
      },
    )
    await this.assertAndConsumeQueue(
      CASHOUT_CREDIT_CONFIRMED_QUEUE,
      "bet.cashout.credit.confirmed",
      async (message) => {
        await this.handleCashoutCreditConfirmedEvent.execute(
          this.parseEvent<CashoutCreditConfirmedEvent>(message),
        )
      },
    )
    await this.assertAndConsumeQueue(
      CASHOUT_CREDIT_REJECTED_QUEUE,
      "bet.cashout.credit.rejected",
      async (message) => {
        await this.handleCashoutCreditRejectedEvent.execute(
          this.parseEvent<CashoutCreditRejectedEvent>(message),
        )
      },
    )
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close()
    await this.connection?.close()
  }

  async publish(event: WalletSettlementEvent): Promise<void> {
    if (!this.channel) {
      throw new Error("Games RabbitMQ channel is not initialized.")
    }

    this.channel.publish(
      WALLET_SETTLEMENT_EXCHANGE,
      event.name,
      Buffer.from(JSON.stringify(event)),
      {
        contentType: "application/json",
      },
    )
  }

  private async assertAndConsumeQueue(
    queueName: string,
    routingKey: string,
    handler: (message: ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    const channel = this.channel as Channel

    await channel.assertQueue(queueName, { durable: true })
    await channel.bindQueue(
      queueName,
      WALLET_SETTLEMENT_EXCHANGE,
      routingKey,
    )

    await channel.consume(queueName, async (message) => {
      if (!message) {
        return
      }

      try {
        await handler(message)
        channel.ack(message)
      } catch {
        channel.nack(message, false, true)
      }
    })
  }

  private parseEvent<T>(message: ConsumeMessage): T {
    return JSON.parse(message.content.toString()) as T
  }
}
