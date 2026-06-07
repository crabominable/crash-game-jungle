import {
  ROUND_EVENT_PUBLISHER,
  type RoundEventPublisher,
} from "./round-events.publisher"
import { Inject, Injectable } from "@nestjs/common"
import { ProvablyFair } from "../domain/provably-fair"
import { Round } from "../domain/round/round"
import { CurrentRoundAlreadyExistsError } from "./games.application.errors"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import { toRoundSnapshot, type RoundSnapshot } from "./round.snapshot"

export interface CreateRoundCommand {
  roundId: string
  startedAt: string
}

@Injectable()
export class CreateRoundService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject(ROUND_EVENT_PUBLISHER)
    private readonly roundEventPublisher: RoundEventPublisher,
  ) {}

  async execute(command: CreateRoundCommand): Promise<RoundSnapshot> {
    const provablyFair = ProvablyFair.generateRoundArtifacts()

    const round = Round.create({
      algorithmVersion: provablyFair.algorithmVersion,
      crashMultiplierBasisPoints: provablyFair.crashMultiplierBasisPoints,
      roundId: command.roundId,
      serverSeed: provablyFair.serverSeed,
      serverSeedHash: provablyFair.serverSeedHash,
      startedAt: command.startedAt,
    })

    try {
      await this.roundRepository.create(round)
      this.roundEventPublisher.publishRoundUpdated(toRoundSnapshot(round))
    } catch (error) {
      if (error instanceof CurrentRoundAlreadyExistsError) {
        throw error
      }

      throw error
    }

    return toRoundSnapshot(round)
  }
}
