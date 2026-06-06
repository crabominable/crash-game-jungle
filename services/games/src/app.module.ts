import { Module } from "@nestjs/common"
import { AcceptCashoutService } from "./application/accept-cashout.service"
import { ConfirmBetDebitService } from "./application/confirm-bet-debit.service"
import { ConfirmCashoutCreditService } from "./application/confirm-cashout-credit.service"
import { CrashRoundService } from "./application/crash-round.service"
import { CreateRoundService } from "./application/create-round.service"
import { GetCurrentRoundService } from "./application/get-current-round.service"
import { PlaceBetService } from "./application/place-bet.service"
import { RejectBetDebitService } from "./application/reject-bet-debit.service"
import { RejectCashoutCreditService } from "./application/reject-cashout-credit.service"
import { ROUND_REPOSITORY } from "./application/round.repository"
import { StartRoundService } from "./application/start-round.service"
import { InMemoryRoundRepository } from "./infrastructure/persistence/in-memory-round.repository"
import { GamesController } from "./presentation/controllers/games.controller"

@Module({
  controllers: [GamesController],
  providers: [
    AcceptCashoutService,
    ConfirmBetDebitService,
    ConfirmCashoutCreditService,
    CrashRoundService,
    CreateRoundService,
    GetCurrentRoundService,
    PlaceBetService,
    RejectBetDebitService,
    RejectCashoutCreditService,
    StartRoundService,
    InMemoryRoundRepository,
    {
      provide: ROUND_REPOSITORY,
      useExisting: InMemoryRoundRepository,
    },
  ],
})
export class AppModule {}
