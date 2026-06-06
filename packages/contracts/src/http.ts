export interface AcceptedAsyncCommandResponse<TStatus extends string = string> {
  acceptedAt: string
  correlationId: string
  final: false
  status: TStatus
}
