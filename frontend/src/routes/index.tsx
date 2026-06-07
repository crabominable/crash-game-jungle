import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useGame, BetSnapshot } from '../contexts/GameContext'

export const Route = createFileRoute('/')({
  component: CrashGame,
})

function Mascot({ multiplier }: { multiplier: number }) {
  // Simple mascot SVG (Monkey)
  return (
    <div className="mascot-container absolute top-1/2 left-1/2 w-full h-full flex justify-center items-center opacity-15" style={{ transform: `translate(-50%, calc(-50% - ${Math.min(multiplier * 2, 50)}px))` }}>
      <svg className="w-[300px] h-[300px]" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-brown-dark)" strokeWidth="2"/>
        <circle cx="50" cy="50" r="30" fill="var(--color-brown-primary)" />
        <ellipse cx="50" cy="58" rx="20" ry="15" fill="#d7ccc8" />
        <circle cx="35" cy="40" r="8" fill="#d7ccc8" />
        <circle cx="65" cy="40" r="8" fill="#d7ccc8" />
        <circle cx="35" cy="40" r="3" fill="#3e2723" />
        <circle cx="65" cy="40" r="3" fill="#3e2723" />
        <path d="M 40 60 Q 50 70 60 60" fill="transparent" stroke="#3e2723" strokeWidth="3" />
        <circle cx="15" cy="45" r="12" fill="var(--color-brown-primary)" />
        <circle cx="85" cy="45" r="12" fill="var(--color-brown-primary)" />
      </svg>
    </div>
  )
}

function CrashGame() {
  const { isAuthenticated, login, logout, userId } = useAuth()
  const { round, history, wallet, placeBet, cashout, error, clearError, isConnected } = useGame()
  const [betAmount, setBetAmount] = useState('10')
  const [displayMultiplier, setDisplayMultiplier] = useState(1.0)

  const isBettingOpen = round?.status === 'betting_open'
  const isInProgress = round?.status === 'in_progress'
  const isCrashed = round?.status === 'crashed' || round?.status === 'settled'
  
  const myBet = round?.bets.find((b) => b.playerId === userId)
  const hasPlacedBet = !!myBet
  const isMyBetActive = myBet?.status === 'bet_active' || myBet?.status === 'cashout_pending_wallet'

  useEffect(() => {
    let animationFrame: number
    let startTime: number
    
    if (isInProgress && round?.startedAt) {
      startTime = new Date(round.startedAt).getTime()
      
      const updateMultiplier = () => {
        const now = Date.now()
        const elapsedMs = Math.max(0, now - startTime)
        const currentMult = Math.exp(0.00006 * elapsedMs)
        setDisplayMultiplier(currentMult)
        animationFrame = requestAnimationFrame(updateMultiplier)
      }
      
      animationFrame = requestAnimationFrame(updateMultiplier)
    } else if (isCrashed) {
      setDisplayMultiplier((round?.crashMultiplierBasisPoints || 10000) / 10000)
    } else {
      setDisplayMultiplier(1.0)
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [isInProgress, isCrashed, round])

  const handleBetClick = () => {
    if (!isAuthenticated) {
      login()
      return
    }
    
    if (isBettingOpen && !hasPlacedBet) {
      const amountMinor = Math.floor(parseFloat(betAmount) * 100)
      placeBet(amountMinor)
    } else if (isInProgress && isMyBetActive) {
      const currentBasisPoints = Math.floor(displayMultiplier * 10000)
      cashout(currentBasisPoints)
    }
  }

  return (
    <>
      <header className="flex justify-between items-center px-8 py-4 bg-bg-panel border-b-2 border-brown-dark">
        <div className="text-2xl font-bold text-accent-yellow flex items-center gap-2">
          🌴 Crash Monkey
        </div>
        
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <div className="bg-bg-card px-4 py-2 rounded-full font-mono font-semibold text-accent-yellow flex items-center gap-2 border border-brown-primary">
                💰 R$ {wallet ? (parseInt(wallet.balanceMinor) / 100).toFixed(2) : "0.00"}
              </div>
              <span className="text-text-secondary text-sm">{userId}</span>
              <button className="bg-brown-primary hover:bg-brown-dark text-white px-3 py-1 rounded-md font-bold transition-colors" onClick={logout}>Sair</button>
            </>
          ) : (
            <button className="bg-brown-primary hover:bg-brown-dark text-white px-6 py-2 rounded-md font-bold transition-colors" onClick={login}>Entrar</button>
          )}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        
        <aside className="w-[320px] bg-bg-panel border-r-2 border-brown-dark flex flex-col">
          <div className="p-6 border-b border-bg-card">
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm text-text-secondary">Valor da Aposta (R$)</label>
              <input 
                type="number" 
                className="bg-bg-dark border border-brown-primary text-text-primary px-4 py-3 rounded-md text-base font-mono outline-none transition-colors focus:border-accent-green" 
                value={betAmount} 
                onChange={e => setBetAmount(e.target.value)}
                min="0.1"
                step="0.1"
                disabled={!isBettingOpen || hasPlacedBet}
              />
            </div>
            
            {error && <div className="text-accent-red text-sm mt-2 text-center">{error}</div>}
            
            <button 
              className={`w-full rounded-md p-4 text-lg font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isMyBetActive && isInProgress ? 'bg-accent-yellow text-bg-dark hover:bg-accent-yellow-hover hover:-translate-y-0.5' : 'bg-accent-green text-bg-dark hover:bg-accent-green-hover hover:-translate-y-0.5'}`}
              disabled={(!isBettingOpen && !isInProgress) || (isBettingOpen && hasPlacedBet) || (isInProgress && !isMyBetActive) || !isConnected}
              onClick={handleBetClick}
            >
              {!isConnected ? "Conectando..." :
               isBettingOpen && hasPlacedBet ? "Aguardando Início..." :
               isMyBetActive && isInProgress ? "Cash Out" :
               "Apostar"}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-sm text-text-secondary mb-4 flex justify-between">
              <span>Jogadores ({round?.bets.length || 0})</span>
            </div>
            
            {round?.bets.map(bet => {
              const isWin = bet.status === 'won_settled' || bet.status === 'cashout_pending_wallet'
              const isLost = bet.status === 'lost'
              return (
                <div key={bet.betId} className={`flex justify-between items-center p-2 rounded-sm mb-1 bg-bg-card ${isWin ? 'bg-[rgba(46,204,113,0.1)] border-l-4 border-accent-green' : ''} ${isLost ? 'opacity-60' : ''}`}>
                  <span className="font-medium max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{bet.playerId}</span>
                  <div className="flex gap-2 items-center">
                    {isWin && bet.acceptedMultiplierBasisPoints && (
                      <span className="font-mono text-accent-green font-bold bg-[rgba(46,204,113,0.2)] px-1.5 py-0.5 rounded-sm text-sm">{(bet.acceptedMultiplierBasisPoints / 10000).toFixed(2)}x</span>
                    )}
                    <span className="font-mono text-text-secondary">R$ {(bet.amountMinor / 100).toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,var(--color-bg-panel)_0%,var(--color-bg-dark)_100%)]">
          <div className="history-bar flex gap-2 px-4 py-3 bg-black/20 overflow-x-auto">
            {history.map((h) => {
              const mult = (h.crashMultiplierBasisPoints || 10000) / 10000
              const isHigh = mult >= 2.0
              return (
                <div key={h.roundId} className={`px-3 py-1 rounded-full font-mono font-bold text-sm whitespace-nowrap ${isHigh ? 'bg-[rgba(46,204,113,0.2)] text-accent-green' : 'bg-[rgba(231,76,60,0.2)] text-accent-red'}`}>
                  {mult.toFixed(2)}x
                </div>
              )
            })}
          </div>

          <div className="flex-1 flex justify-center items-center flex-col relative">
            {!isConnected && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-accent-red text-white px-6 py-2 rounded-full font-bold z-50 shadow-lg">Conectando ao servidor...</div>}
            
            {isBettingOpen && <div className="absolute top-8 bg-black/60 px-6 py-2 rounded-full font-bold tracking-widest uppercase text-accent-yellow z-20">Preparando próxima rodada...</div>}
            
            <Mascot multiplier={displayMultiplier} />
            
            <div className={`text-[8rem] font-black font-mono text-text-primary z-10 transition-colors duration-300 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${isCrashed ? 'text-accent-red' : ''}`}>
              {displayMultiplier.toFixed(2)}x
            </div>
            
            {isCrashed && (
              <div className="text-accent-red font-bold text-2xl mt-4 z-10">
                Crashed!
              </div>
            )}
            
            {round?.serverSeedHash && (
              <div className="absolute bottom-4 right-4 bg-black/40 px-4 py-2 rounded-md font-mono text-xs text-text-secondary">
                Provably Fair Hash: <span className="text-accent-yellow">{round.serverSeedHash}</span>
              </div>
            )}
          </div>
        </section>
        
      </main>
    </>
  )
}
