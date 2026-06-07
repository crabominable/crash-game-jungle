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

export const WALLET_SETTLEMENT_EXCHANGE = "wallet.settlement"

export interface BetDebitRequestedPayload {
  amountMinor: string
  betId: string
  playerId: string
  roundId: string
}

export interface BetDebitResultPayload {
  betId: string
  playerId: string
  roundId: string
}

export interface BetDebitRejectedPayload extends BetDebitResultPayload {
  reason: "insufficient_funds" | "wallet_not_found" | "processing_error"
}

export interface CashoutCreditRequestedPayload {
  betId: string
  payoutMinor: string
  playerId: string
  roundId: string
}

export interface CashoutCreditResultPayload {
  betId: string
  playerId: string
  roundId: string
}

export interface CashoutCreditRejectedPayload
  extends CashoutCreditResultPayload {
  reason: "wallet_not_found" | "processing_error"
}

export type BetDebitRequestedEvent = IntegrationEventEnvelope<
  "bet.debit.requested",
  BetDebitRequestedPayload
>

export type BetDebitConfirmedEvent = IntegrationEventEnvelope<
  "bet.debit.confirmed",
  BetDebitResultPayload
>

export type BetDebitRejectedEvent = IntegrationEventEnvelope<
  "bet.debit.rejected",
  BetDebitRejectedPayload
>

export type CashoutCreditRequestedEvent = IntegrationEventEnvelope<
  "bet.cashout.credit.requested",
  CashoutCreditRequestedPayload
>

export type CashoutCreditConfirmedEvent = IntegrationEventEnvelope<
  "bet.cashout.credit.confirmed",
  CashoutCreditResultPayload
>

export type CashoutCreditRejectedEvent = IntegrationEventEnvelope<
  "bet.cashout.credit.rejected",
  CashoutCreditRejectedPayload
>

export type WalletSettlementRequestEvent =
  | BetDebitRequestedEvent
  | CashoutCreditRequestedEvent

export type WalletSettlementResultEvent =
  | BetDebitConfirmedEvent
  | BetDebitRejectedEvent
  | CashoutCreditConfirmedEvent
  | CashoutCreditRejectedEvent

export type WalletSettlementEvent =
  | WalletSettlementRequestEvent
  | WalletSettlementResultEvent
