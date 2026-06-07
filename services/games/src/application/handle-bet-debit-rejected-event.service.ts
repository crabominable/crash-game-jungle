import {
  ROUND_EVENT_PUBLISHER,
  type RoundEventPublisher,
} from "./round-events.publisher"
import type { BetDebitRejectedEvent } from "@crash/contracts"
import { Inject, Injectable } from "@nestjs/common"
import { CurrentRoundNotFoundError } from "./games.application.errors"
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "./round.repository"
import { type BetSnapshot, toRoundSnapshot } from "./round.snapshot"

@Injectable()
export class HandleBetDebitRejectedEventService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject(ROUND_EVENT_PUBLISHER)
    private readonly roundEventPublisher: RoundEventPublisher,
  ) {}

  async execute(event: BetDebitRejectedEvent): Promise<BetSnapshot> {
    const round = await this.roundRepository.getCurrent()

    if (!round) {
      throw new CurrentRoundNotFoundError()
    }

    const bet = round.rejectBetDebit({
      betId: event.payload.betId,
      occurredAt: event.emittedAt,
    })

    await this.roundRepository.save(round)
    this.roundEventPublisher.publishRoundUpdated(toRoundSnapshot(round))

    return toRoundSnapshot(round).bets.find(
      (candidate) => candidate.betId === bet.betId,
    ) as BetSnapshot
  }
}
