import type { Round } from "../domain/round/round"

export const ROUND_REPOSITORY = Symbol("ROUND_REPOSITORY")

export interface RoundRepository {
  create(round: Round): Promise<void>
  getCurrent(): Promise<Round | null>
  save(round: Round): Promise<void>
  findById(roundId: string): Promise<Round | null>
  findHistory(limit: number): Promise<Round[]>
}
