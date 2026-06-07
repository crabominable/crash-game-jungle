import { Injectable } from "@nestjs/common"
import { CurrentRoundAlreadyExistsError } from "../../application/games.application.errors"
import type { RoundRepository } from "../../application/round.repository"
import type { Round } from "../../domain/round/round"

@Injectable()
export class InMemoryRoundRepository implements RoundRepository {
  private currentRound: Round | null = null
  private readonly rounds: Map<string, Round> = new Map()

  async create(round: Round): Promise<void> {
    if (this.currentRound && this.currentRound.status !== "settled") {
      throw new CurrentRoundAlreadyExistsError(round.roundId)
    }

    this.currentRound = round
    this.rounds.set(round.roundId, round)
  }

  async getCurrent(): Promise<Round | null> {
    return this.currentRound
  }

  async save(round: Round): Promise<void> {
    this.currentRound = round
    this.rounds.set(round.roundId, round)
  }

  async findById(roundId: string): Promise<Round | null> {
    return this.rounds.get(roundId) || null
  }

  async findHistory(limit: number): Promise<Round[]> {
    const allRounds = Array.from(this.rounds.values())
    // Return only crashed or settled rounds, sorted by startedAt descending
    const history = allRounds
      .filter((r) => r.status === "crashed" || r.status === "settled")
      .sort((a, b) => {
        const timeA = a.startedAtTimestamp ? new Date(a.startedAtTimestamp).getTime() : 0
        const timeB = b.startedAtTimestamp ? new Date(b.startedAtTimestamp).getTime() : 0
        return timeB - timeA
      })

    return history.slice(0, limit)
  }
}
