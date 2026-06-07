import {
  ROUND_EVENT_PUBLISHER,
  type RoundEventPublisher,
} from "./round-events.publisher"
import { Inject, Injectable } from "@nestjs/common"
import { CurrentRoundNotFoundError } from "./games.application.errors"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import {
  type BetSnapshot,
  toRoundSnapshot,
} from "./round.snapshot"

export interface ConfirmBetDebitCommand {
  betId: string
  occurredAt: string
}

@Injectable()
export class ConfirmBetDebitService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject(ROUND_EVENT_PUBLISHER)
    private readonly roundEventPublisher: RoundEventPublisher,
  ) {}

  async execute(command: ConfirmBetDebitCommand): Promise<BetSnapshot> {
    const round = await this.roundRepository.getCurrent()

    if (!round) {
      throw new CurrentRoundNotFoundError()
    }

    const bet = round.confirmBetDebit(command)

    await this.roundRepository.save(round)
    this.roundEventPublisher.publishRoundUpdated(toRoundSnapshot(round))

    return toRoundSnapshot(round).bets.find(
      (candidate) => candidate.betId === bet.betId,
    ) as BetSnapshot
  }
}
