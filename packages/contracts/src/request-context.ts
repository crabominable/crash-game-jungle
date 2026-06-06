export interface RequestContext {
  causationId?: string
  correlationId: string
  requestId: string
}
