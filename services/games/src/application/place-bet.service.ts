import { Inject, Injectable } from "@nestjs/common"
import { CurrentRoundNotFoundError } from "./games.application.errors"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import { type BetSnapshot, toRoundSnapshot } from "./round.snapshot"

export interface PlaceBetCommand {
  amountMinor: bigint
  correlationId: string
  occurredAt: string
  playerId: string
}

@Injectable()
export class PlaceBetService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async execute(command: PlaceBetCommand): Promise<BetSnapshot> {
    const round = await this.roundRepository.getCurrent()

    if (!round) {
      throw new CurrentRoundNotFoundError()
    }

    round.placeBet(command)
    await this.roundRepository.save(round)

    const snapshot = toRoundSnapshot(round)

    return snapshot.bets[snapshot.bets.length - 1] as BetSnapshot
  }
}
