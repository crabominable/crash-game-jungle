import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "./AuthContext"

export interface BetSnapshot {
  acceptedMultiplierBasisPoints?: number
  amountMinor: number
  betId: string
  cashoutCorrelationId?: string
  cashoutRequestedAt?: string
  correlationId: string
  payoutMinor?: number
  playerId: string
  status: "bet_pending_wallet" | "bet_active" | "cashout_pending_wallet" | "won_settled" | "lost"
}

export interface RoundSnapshot {
  algorithmVersion: string
  bets: BetSnapshot[]
  crashMultiplierBasisPoints?: number
  crashedAt?: string
  roundId: string
  openedAt?: string
  serverSeed?: string
  serverSeedHash: string
  startedAt?: string
  status: "betting_open" | "in_progress" | "crashed" | "settled"
}

export interface Wallet {
  playerId: string
  balanceMinor: string
  version: number
}

interface GameContextType {
  round: RoundSnapshot | null
  history: RoundSnapshot[]
  wallet: Wallet | null
  placeBet: (amountMinor: number) => Promise<void>
  cashout: (payoutMultiplierBasisPoints: number) => Promise<void>
  error: string | null
  clearError: () => void
  isConnected: boolean
}

const GameContext = createContext<GameContextType | null>(null)

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) throw new Error("useGame must be used within a GameProvider")
  return context
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, userId } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [round, setRound] = useState<RoundSnapshot | null>(null)
  const [history, setHistory] = useState<RoundSnapshot[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial data
  const fetchWallet = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("http://localhost:8000/wallets/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setWallet(data)
      }
    } catch (e) {
      console.error("Failed to fetch wallet", e)
    }
  }, [token])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/games/rounds/history")
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (e) {
      console.error("Failed to fetch history", e)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet()
    }
  }, [isAuthenticated, fetchWallet])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Setup WebSocket
  useEffect(() => {
    const newSocket = io("http://localhost:8000", {
      transports: ["websocket"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    newSocket.on("connect", () => {
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
    })

    newSocket.on("round.snapshot", (snapshot: RoundSnapshot | null) => {
      setRound(snapshot)
      
      // Update wallet if we detect our bet settled or round ended
      // In a more robust system, we would listen to specific wallet events
      // For MVP, we refetch wallet if round crashes or settles to ensure correct balance
      if (snapshot && (snapshot.status === "crashed" || snapshot.status === "settled")) {
        fetchHistory()
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [fetchHistory])

  // Refetch wallet when round status changes to "crashed" or "settled" to update balance
  useEffect(() => {
    if (round && (round.status === "crashed" || round.status === "settled")) {
      setTimeout(() => fetchWallet(), 1000) // small delay for wallet event processing
    }
  }, [round?.status, fetchWallet])

  const placeBet = async (amountMinor: number) => {
    if (!token) {
      setError("Você precisa estar logado para apostar")
      return
    }
    
    try {
      const correlationId = crypto.randomUUID()
      const res = await fetch("http://localhost:8000/games/rounds/current/bets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountMinor, correlationId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Erro ao fazer aposta")
      }
      
      // Optimistically fetch wallet to show deducted balance
      setTimeout(fetchWallet, 500)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const cashout = async (payoutMultiplierBasisPoints: number) => {
    if (!token) return

    try {
      const cashoutCorrelationId = crypto.randomUUID()
      const res = await fetch("http://localhost:8000/games/rounds/current/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payoutMultiplierBasisPoints, cashoutCorrelationId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Erro no cashout")
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const clearError = () => setError(null)

  return (
    <GameContext.Provider
      value={{
        round,
        history,
        wallet,
        placeBet,
        cashout,
        error,
        clearError,
        isConnected,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}
