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
import { toRoundSnapshot, type RoundSnapshot } from "./round.snapshot"

export interface CrashRoundCommand {
  occurredAt: string
}

@Injectable()
export class CrashRoundService {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject(ROUND_EVENT_PUBLISHER)
    private readonly roundEventPublisher: RoundEventPublisher,
  ) {}

  async execute(command: CrashRoundCommand): Promise<RoundSnapshot> {
    const round = await this.roundRepository.getCurrent()

    if (!round) {
      throw new CurrentRoundNotFoundError()
    }

    round.crash(command.occurredAt)
    await this.roundRepository.save(round)
    this.roundEventPublisher.publishRoundUpdated(toRoundSnapshot(round))

    return toRoundSnapshot(round)
  }
}
