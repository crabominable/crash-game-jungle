import { Module } from "@nestjs/common"
import { CreateWalletService } from "./application/create-wallet.service"
import { CreditWalletService } from "./application/credit-wallet.service"
import { DebitWalletService } from "./application/debit-wallet.service"
import { GetWalletByPlayerService } from "./application/get-wallet-by-player.service"
import { WALLET_REPOSITORY } from "./application/wallet.repository"
import { InMemoryWalletRepository } from "./infrastructure/persistence/in-memory-wallet.repository"
import { WalletsController } from "./presentation/controllers/wallets.controller"

@Module({
  controllers: [WalletsController],
  providers: [
    CreateWalletService,
    CreditWalletService,
    DebitWalletService,
    GetWalletByPlayerService,
    InMemoryWalletRepository,
    {
      provide: WALLET_REPOSITORY,
      useExisting: InMemoryWalletRepository,
    },
  ],
})
export class AppModule {}
