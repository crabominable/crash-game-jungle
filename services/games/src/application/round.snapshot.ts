import type { Bet, Round } from "../domain/round/round"

export interface BetSnapshot {
  acceptedMultiplierBasisPoints?: number
  amountMinor: string
  betId: string
  cashoutCorrelationId?: string
  cashoutRequestedAt?: string
  payoutMinor?: string
  placedAt: string
  playerId: string
  status: Bet["status"]
  walletCorrelationId: string
  walletSettledAt?: string
}

export interface RoundSnapshot {
  bets: BetSnapshot[]
  crashMultiplierBasisPoints?: number
  crashedAt?: string
  roundId: string
  openedAt?: string
  startedAt?: string
  status: Round["status"]
}

export function toRoundSnapshot(round: Round): RoundSnapshot {
  return {
    bets: round.bets.map(toBetSnapshot),
    crashMultiplierBasisPoints: round.crashMultiplierBasisPoints,
    crashedAt: round.crashedAtTimestamp,
    openedAt: round.openedAt,
    roundId: round.roundId,
    startedAt: round.startedAtTimestamp,
    status: round.status,
  }
}

function toBetSnapshot(bet: Bet): BetSnapshot {
  return {
    acceptedMultiplierBasisPoints: bet.acceptedMultiplierBasisPoints,
    amountMinor: bet.amountMinor.toString(),
    betId: bet.betId,
    cashoutCorrelationId: bet.cashoutCorrelationId,
    cashoutRequestedAt: bet.cashoutRequestedAt,
    payoutMinor: bet.payoutMinor?.toString(),
    placedAt: bet.placedAt,
    playerId: bet.playerId,
    status: bet.status,
    walletCorrelationId: bet.walletCorrelationId,
    walletSettledAt: bet.walletSettledAt,
  }
}
