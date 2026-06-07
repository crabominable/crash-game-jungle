import type { HealthCheckResponse } from "@crash/contracts"
import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus, Param } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"
import { GetCurrentRoundService } from "../../application/get-current-round.service"
import { PlaceBetService } from "../../application/place-bet.service"
import { AcceptCashoutService } from "../../application/accept-cashout.service"
import { GetRoundHistoryService } from "../../application/get-round-history.service"
import { VerifyRoundService } from "../../application/verify-round.service"
import { PlayerId } from "../decorators/player-id.decorator"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from "@nestjs/swagger"

class PlaceBetDto {
  @ApiProperty({ description: "Amount to bet in minor units (e.g. cents)", example: 1000 })
  amountMinor: number

  @ApiProperty({ description: "Idempotency key for the bet", example: "uuid-1234" })
  correlationId: string
}

class AcceptCashoutDto {
  @ApiProperty({ description: "Idempotency key for the cashout", example: "uuid-5678" })
  cashoutCorrelationId: string

  @ApiProperty({ description: "Multiplier in basis points at which to cash out", example: 150 })
  payoutMultiplierBasisPoints: number
}

@ApiTags("Games")
@Controller()
export class GamesController {
  constructor(
    private readonly getCurrentRound: GetCurrentRoundService,
    private readonly placeBet: PlaceBetService,
    private readonly acceptCashout: AcceptCashoutService,
    private readonly getRoundHistory: GetRoundHistoryService,
    private readonly verifyRound: VerifyRoundService,
  ) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  check(): HealthCheckResponse {
    return { status: "ok", service: "games" }
  }

  @Get("rounds/history")
  @ApiOperation({ summary: "Get round history" })
  @ApiResponse({ status: 200, description: "Returns the history of recent rounds" })
  async getHistory() {
    try {
      return await this.getRoundHistory.execute(20)
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get("rounds/:roundId/verify")
  @ApiOperation({ summary: "Verify a past round cryptographically" })
  @ApiResponse({ status: 200, description: "Returns round verification details" })
  async verify(@Param("roundId") roundId: string) {
    try {
      return await this.verifyRound.execute(roundId)
    } catch (error: any) {
      if (error.name === "RoundNotFoundError") {
        throw new HttpException("Round not found", HttpStatus.NOT_FOUND)
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("rounds/current")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current active round state" })
  @ApiResponse({ status: 200, description: "Returns the current round state" })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Place a bet on the current round" })
  @ApiResponse({ status: 201, description: "Bet placed successfully" })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Accept cashout for the current round" })
  @ApiResponse({ status: 201, description: "Cashout successful" })
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
