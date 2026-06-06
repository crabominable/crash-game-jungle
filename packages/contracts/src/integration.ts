import type { ServiceName } from "./health"

export interface IntegrationEventEnvelope<
  TName extends string = string,
  TPayload = unknown,
> {
  emittedAt: string
  name: TName
  payload: TPayload
  source: ServiceName
  correlationId: string
}
