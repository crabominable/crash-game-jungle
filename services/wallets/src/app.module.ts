import { Module } from "@nestjs/common"
import { CreateWalletService } from "./application/create-wallet.service"
import { CreditWalletService } from "./application/credit-wallet.service"
import { DebitWalletService } from "./application/debit-wallet.service"
import { GetWalletByPlayerService } from "./application/get-wallet-by-player.service"
import { HandleBetDebitRequestedEventService } from "./application/handle-bet-debit-requested-event.service"
import { HandleCashoutCreditRequestedEventService } from "./application/handle-cashout-credit-requested-event.service"
import { WALLET_REPOSITORY } from "./application/wallet.repository"
import { RabbitMqWalletsSettlementIntegration } from "./infrastructure/messaging/rabbitmq-wallets-settlement.integration"
import { InMemoryWalletRepository } from "./infrastructure/persistence/in-memory-wallet.repository"
import { WalletsController } from "./presentation/controllers/wallets.controller"

import { AuthModule } from "./infrastructure/auth/auth.module"

@Module({
  imports: [AuthModule],
  controllers: [WalletsController],
  providers: [
    CreateWalletService,
    CreditWalletService,
    DebitWalletService,
    GetWalletByPlayerService,
    HandleBetDebitRequestedEventService,
    HandleCashoutCreditRequestedEventService,
    RabbitMqWalletsSettlementIntegration,
    InMemoryWalletRepository,
    {
      provide: WALLET_REPOSITORY,
      useExisting: InMemoryWalletRepository,
    },
  ],
})
export class AppModule {}
