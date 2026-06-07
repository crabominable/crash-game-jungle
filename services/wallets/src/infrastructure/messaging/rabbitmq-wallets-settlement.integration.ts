import {
  WALLET_SETTLEMENT_EXCHANGE,
  type BetDebitRequestedEvent,
  type CashoutCreditRequestedEvent,
  type WalletSettlementResultEvent,
} from "@crash/contracts"
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib"
import { HandleBetDebitRequestedEventService } from "../../application/handle-bet-debit-requested-event.service"
import { HandleCashoutCreditRequestedEventService } from "../../application/handle-cashout-credit-requested-event.service"

const BET_DEBIT_REQUESTED_QUEUE = "wallets.bet-debit-requested"
const CASHOUT_CREDIT_REQUESTED_QUEUE = "wallets.cashout-credit-requested"

@Injectable()
export class RabbitMqWalletsSettlementIntegration
  implements OnModuleInit, OnModuleDestroy
{
  private channel: Channel | null = null
  private connection: ChannelModel | null = null

  constructor(
    private readonly handleBetDebitRequestedEvent: HandleBetDebitRequestedEventService,
    private readonly handleCashoutCreditRequestedEvent: HandleCashoutCreditRequestedEventService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rabbitMqUrl = process.env.RABBITMQ_URL

    if (!rabbitMqUrl) {
      throw new Error("RABBITMQ_URL is required for wallets settlement integration.")
    }

    this.connection = await connect(rabbitMqUrl)
    this.channel = await this.connection.createChannel()

    await this.channel.assertExchange(WALLET_SETTLEMENT_EXCHANGE, "topic", {
      durable: true,
    })

    await this.assertAndConsumeQueue(
      BET_DEBIT_REQUESTED_QUEUE,
      "bet.debit.requested",
      async (message) => {
        const response = await this.handleBetDebitRequestedEvent.execute(
          this.parseEvent<BetDebitRequestedEvent>(message),
        )

        await this.publish(response)
      },
    )
    await this.assertAndConsumeQueue(
      CASHOUT_CREDIT_REQUESTED_QUEUE,
      "bet.cashout.credit.requested",
      async (message) => {
        const response = await this.handleCashoutCreditRequestedEvent.execute(
          this.parseEvent<CashoutCreditRequestedEvent>(message),
        )

        await this.publish(response)
      },
    )
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close()
    await this.connection?.close()
  }

  private async publish(event: WalletSettlementResultEvent): Promise<void> {
    const channel = this.channel as Channel

    channel.publish(
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
