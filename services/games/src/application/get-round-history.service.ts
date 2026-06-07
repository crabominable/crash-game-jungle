import { Inject, Injectable } from "@nestjs/common"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import { toRoundSnapshot, type RoundSnapshot } from "./round.snapshot"

@Injectable()
export class GetRoundHistoryService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async execute(limit = 20): Promise<RoundSnapshot[]> {
    const rounds = await this.roundRepository.findHistory(limit)
    return rounds.map(toRoundSnapshot)
  }
}
