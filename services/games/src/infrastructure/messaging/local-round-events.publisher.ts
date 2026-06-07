import { Injectable } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import type { RoundEventPublisher } from "../../application/round-events.publisher"
import type { RoundSnapshot } from "../../application/round.snapshot"

@Injectable()
export class LocalRoundEventsPublisher implements RoundEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publishRoundUpdated(snapshot: RoundSnapshot): void {
    this.eventEmitter.emit("round.updated", snapshot)
  }
}
