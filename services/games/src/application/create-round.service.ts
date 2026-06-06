import { Inject, Injectable } from "@nestjs/common"
import { Round } from "../domain/round/round"
import { CurrentRoundAlreadyExistsError } from "./games.application.errors"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import { toRoundSnapshot, type RoundSnapshot } from "./round.snapshot"

export interface CreateRoundCommand {
  crashMultiplierBasisPoints?: number
  roundId: string
  startedAt: string
}

@Injectable()
export class CreateRoundService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async execute(command: CreateRoundCommand): Promise<RoundSnapshot> {
    const round = Round.create(command)

    try {
      await this.roundRepository.create(round)
    } catch (error) {
      if (error instanceof CurrentRoundAlreadyExistsError) {
        throw error
      }

      throw error
    }

    return toRoundSnapshot(round)
  }
}
