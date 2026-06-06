import { Injectable } from "@nestjs/common"
import { CurrentRoundAlreadyExistsError } from "../../application/games.application.errors"
import type { RoundRepository } from "../../application/round.repository"
import type { Round } from "../../domain/round/round"

@Injectable()
export class InMemoryRoundRepository implements RoundRepository {
  private currentRound: Round | null = null

  async create(round: Round): Promise<void> {
    if (this.currentRound && this.currentRound.status !== "settled") {
      throw new CurrentRoundAlreadyExistsError(round.roundId)
    }

    this.currentRound = round
  }

  async getCurrent(): Promise<Round | null> {
    return this.currentRound
  }

  async save(round: Round): Promise<void> {
    this.currentRound = round
  }
}
