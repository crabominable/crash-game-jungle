import type { HealthCheckResponse } from "@crash/contracts"
import { Controller, Get, UseGuards, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { GetWalletByPlayerService } from "../../application/get-wallet-by-player.service"
import { PlayerId } from "../decorators/player-id.decorator"

@Controller()
export class WalletsController {
  constructor(private readonly getWalletByPlayerService: GetWalletByPlayerService) {}

  @Get("health")
  check(): HealthCheckResponse {
    return { status: "ok", service: "wallets" }
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  async getMyWallet(@PlayerId() playerId: string) {
    try {
      const wallet = await this.getWalletByPlayerService.execute({ playerId })
      return wallet
    } catch (error) {
      throw new UnauthorizedException("Wallet not found")
    }
  }
}
