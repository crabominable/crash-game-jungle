import type { HealthCheckResponse } from "@crash/contracts"
import { Controller, Get, UseGuards, UnauthorizedException } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { GetWalletByPlayerService } from "../../application/get-wallet-by-player.service"
import { PlayerId } from "../decorators/player-id.decorator"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags("Wallets")
@Controller()
export class WalletsController {
  constructor(private readonly getWalletByPlayerService: GetWalletByPlayerService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  check(): HealthCheckResponse {
    return { status: "ok", service: "wallets" }
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current player's wallet" })
  @ApiResponse({ status: 200, description: "Returns the player's wallet and balance" })
  async getMyWallet(@PlayerId() playerId: string) {
    try {
      const wallet = await this.getWalletByPlayerService.execute({ playerId })
      return wallet
    } catch (error) {
      throw new UnauthorizedException("Wallet not found")
    }
  }
}
