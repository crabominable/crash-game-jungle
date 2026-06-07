import { Module } from "@nestjs/common"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { AcceptCashoutService } from "./application/accept-cashout.service"
import { ConfirmBetDebitService } from "./application/confirm-bet-debit.service"
import { ConfirmCashoutCreditService } from "./application/confirm-cashout-credit.service"
import { CrashRoundService } from "./application/crash-round.service"
import { CreateRoundService } from "./application/create-round.service"
import { GetCurrentRoundService } from "./application/get-current-round.service"
import { HandleBetDebitConfirmedEventService } from "./application/handle-bet-debit-confirmed-event.service"
import { HandleBetDebitRejectedEventService } from "./application/handle-bet-debit-rejected-event.service"
import { HandleCashoutCreditConfirmedEventService } from "./application/handle-cashout-credit-confirmed-event.service"
import { HandleCashoutCreditRejectedEventService } from "./application/handle-cashout-credit-rejected-event.service"
import { PlaceBetService } from "./application/place-bet.service"
import { RejectBetDebitService } from "./application/reject-bet-debit.service"
import { RejectCashoutCreditService } from "./application/reject-cashout-credit.service"
import { ROUND_REPOSITORY } from "./application/round.repository"
import { ROUND_EVENT_PUBLISHER } from "./application/round-events.publisher"
import {
  RequestBetDebitSettlementService,
  RequestCashoutCreditSettlementService,
  SETTLEMENT_EVENT_PUBLISHER,
} from "./application/settlement-events.publisher"
import { StartRoundService } from "./application/start-round.service"
import { RabbitMqGamesSettlementIntegration } from "./infrastructure/messaging/rabbitmq-games-settlement.integration"
import { LocalRoundEventsPublisher } from "./infrastructure/messaging/local-round-events.publisher"
import { InMemoryRoundRepository } from "./infrastructure/persistence/in-memory-round.repository"
import { GamesController } from "./presentation/controllers/games.controller"
import { GamesGateway } from "./presentation/gateways/games.gateway"

import { AuthModule } from "./infrastructure/auth/auth.module"

@Module({
  imports: [
    AuthModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [GamesController],
  providers: [
    GamesGateway,
    AcceptCashoutService,
    ConfirmBetDebitService,
    ConfirmCashoutCreditService,
    CrashRoundService,
    CreateRoundService,
    GetCurrentRoundService,
    HandleBetDebitConfirmedEventService,
    HandleBetDebitRejectedEventService,
    HandleCashoutCreditConfirmedEventService,
    HandleCashoutCreditRejectedEventService,
    PlaceBetService,
    RejectBetDebitService,
    RejectCashoutCreditService,
    RequestBetDebitSettlementService,
    RequestCashoutCreditSettlementService,
    StartRoundService,
    RabbitMqGamesSettlementIntegration,
    LocalRoundEventsPublisher,
    InMemoryRoundRepository,
    {
      provide: ROUND_REPOSITORY,
      useExisting: InMemoryRoundRepository,
    },
    {
      provide: SETTLEMENT_EVENT_PUBLISHER,
      useExisting: RabbitMqGamesSettlementIntegration,
    },
    {
      provide: ROUND_EVENT_PUBLISHER,
      useExisting: LocalRoundEventsPublisher,
    },
  ],
})
export class AppModule {}
