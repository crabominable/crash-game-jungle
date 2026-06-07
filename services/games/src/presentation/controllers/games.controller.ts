import type { HealthCheckResponse } from "@crash/contracts"
import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { GetCurrentRoundService } from "../../application/get-current-round.service"
import { PlaceBetService } from "../../application/place-bet.service"
import { AcceptCashoutService } from "../../application/accept-cashout.service"
import { PlayerId } from "../decorators/player-id.decorator"

interface PlaceBetDto {
  amountMinor: number
  correlationId: string
}

interface AcceptCashoutDto {
  cashoutCorrelationId: string
  payoutMultiplierBasisPoints: number
}

@Controller()
export class GamesController {
  constructor(
    private readonly getCurrentRound: GetCurrentRoundService,
    private readonly placeBet: PlaceBetService,
    private readonly acceptCashout: AcceptCashoutService
  ) {}

  @Get("health")
  check(): HealthCheckResponse {
    return { status: "ok", service: "games" }
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("rounds/current")
  async getCurrent() {
    try {
      return await this.getCurrentRound.execute()
    } catch (error: any) {
      if (error.name === "CurrentRoundNotFoundError") {
        throw new HttpException("Current round not found", HttpStatus.NOT_FOUND)
      }
      throw error
    }
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("rounds/current/bets")
  async bet(@PlayerId() playerId: string, @Body() dto: PlaceBetDto) {
    try {
      return await this.placeBet.execute({
        playerId,
        amountMinor: BigInt(dto.amountMinor),
        correlationId: dto.correlationId,
        occurredAt: new Date().toISOString()
      })
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("rounds/current/cashout")
  async cashout(@PlayerId() playerId: string, @Body() dto: AcceptCashoutDto) {
    try {
      return await this.acceptCashout.execute({
        playerId,
        cashoutCorrelationId: dto.cashoutCorrelationId,
        payoutMultiplierBasisPoints: dto.payoutMultiplierBasisPoints,
        occurredAt: new Date().toISOString()
      })
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }
  }
}
