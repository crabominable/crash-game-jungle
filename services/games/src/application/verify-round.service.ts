import { Inject, Injectable } from "@nestjs/common"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import { RoundNotFoundError } from "./games.application.errors"

export interface VerifyRoundResponse {
  algorithmVersion: string
  crashMultiplierBasisPoints: number
  roundId: string
  serverSeed: string | null
  serverSeedHash: string
}

@Injectable()
export class VerifyRoundService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async execute(roundId: string): Promise<VerifyRoundResponse> {
    const round = await this.roundRepository.findById(roundId)

    if (!round) {
      throw new RoundNotFoundError(roundId)
    }

    const isRevealed = round.status === "crashed" || round.status === "settled"

    return {
      algorithmVersion: round.algorithmVersion,
      crashMultiplierBasisPoints: round.crashMultiplierBasisPoints,
      roundId: round.roundId,
      serverSeed: isRevealed ? round.serverSeed : null,
      serverSeedHash: round.serverSeedHash,
    }
  }
}
