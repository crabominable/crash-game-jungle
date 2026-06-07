import type { RoundSnapshot } from "./round.snapshot"

export const ROUND_EVENT_PUBLISHER = Symbol("ROUND_EVENT_PUBLISHER")

export interface RoundEventPublisher {
  publishRoundUpdated(snapshot: RoundSnapshot): void
}
