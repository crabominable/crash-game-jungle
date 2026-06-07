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
    <div className="mascot-container" style={{ transform: `translate(-50%, calc(-50% - ${Math.min(multiplier * 2, 50)}px))` }}>
      <svg className="mascot-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-brown-dark)" strokeWidth="2"/>
        {/* Monkey Face */}
        <circle cx="50" cy="50" r="30" fill="var(--color-brown-primary)" />
        <ellipse cx="50" cy="58" rx="20" ry="15" fill="#d7ccc8" />
        <circle cx="35" cy="40" r="8" fill="#d7ccc8" />
        <circle cx="65" cy="40" r="8" fill="#d7ccc8" />
        <circle cx="35" cy="40" r="3" fill="#3e2723" />
        <circle cx="65" cy="40" r="3" fill="#3e2723" />
        <path d="M 40 60 Q 50 70 60 60" fill="transparent" stroke="#3e2723" strokeWidth="3" />
        {/* Ears */}
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

  // Derive active states
  const isBettingOpen = round?.status === 'betting_open'
  const isInProgress = round?.status === 'in_progress'
  const isCrashed = round?.status === 'crashed' || round?.status === 'settled'
  
  // Find my bet
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
        // Inverse of crash formula approx for visualization
        // 100 * e / (e - h) ... the exact real-time curve requires knowing the rate.
        // For visual sake: e^(r*t) where r is ~0.00006
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
      // Cashout at current visual multiplier
      const currentBasisPoints = Math.floor(displayMultiplier * 10000)
      cashout(currentBasisPoints)
    }
  }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          🌴 Crash Monkey
        </div>
        
        <div className="header-user">
          {isAuthenticated ? (
            <>
              <div className="wallet-balance">
                💰 R$ {wallet ? (parseInt(wallet.balanceMinor) / 100).toFixed(2) : "0.00"}
              </div>
              <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>{userId}</span>
              <button className="btn-login" onClick={logout} style={{padding: '0.25rem 0.75rem'}}>Sair</button>
            </>
          ) : (
            <button className="btn-login" onClick={login}>Entrar</button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        
        {/* Sidebar Controls */}
        <aside className="sidebar">
          <div className="bet-form-container">
            <div className="bet-input-group">
              <label>Valor da Aposta (R$)</label>
              <input 
                type="number" 
                className="bet-input" 
                value={betAmount} 
                onChange={e => setBetAmount(e.target.value)}
                min="0.1"
                step="0.1"
                disabled={!isBettingOpen || hasPlacedBet}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              className={`btn ${isMyBetActive && isInProgress ? 'btn-cashout' : 'btn-bet'}`}
              disabled={(!isBettingOpen && !isInProgress) || (isBettingOpen && hasPlacedBet) || (isInProgress && !isMyBetActive) || !isConnected}
              onClick={handleBetClick}
            >
              {!isConnected ? "Conectando..." :
               isBettingOpen && hasPlacedBet ? "Aguardando Início..." :
               isMyBetActive && isInProgress ? "Cash Out" :
               "Apostar"}
            </button>
          </div>
          
          <div className="players-list-container">
            <div className="players-list-header">
              <span>Jogadores ({round?.bets.length || 0})</span>
            </div>
            
            {round?.bets.map(bet => {
              const isWin = bet.status === 'won_settled' || bet.status === 'cashout_pending_wallet'
              const isLost = bet.status === 'lost'
              return (
                <div key={bet.betId} className={`player-item ${isWin ? 'cashed-out' : ''} ${isLost ? 'lost' : ''}`}>
                  <span className="player-name">{bet.playerId}</span>
                  <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                    {isWin && bet.acceptedMultiplierBasisPoints && (
                      <span className="player-multiplier">{(bet.acceptedMultiplierBasisPoints / 10000).toFixed(2)}x</span>
                    )}
                    <span className="player-amount">R$ {(bet.amountMinor / 100).toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Game Canvas */}
        <section className="game-area">
          {/* History Bar */}
          <div className="history-bar">
            {history.map((h) => {
              const mult = (h.crashMultiplierBasisPoints || 10000) / 10000
              const isHigh = mult >= 2.0
              return (
                <div key={h.roundId} className={`history-item ${isHigh ? 'high' : 'low'}`}>
                  {mult.toFixed(2)}x
                </div>
              )
            })}
          </div>

          <div className="display-container">
            {!isConnected && <div className="connection-warning">Conectando ao servidor...</div>}
            
            {isBettingOpen && <div className="status-overlay">Preparando próxima rodada...</div>}
            
            <Mascot multiplier={displayMultiplier} />
            
            <div className={`multiplier-text ${isCrashed ? 'crashed' : ''}`}>
              {displayMultiplier.toFixed(2)}x
            </div>
            
            {isCrashed && (
              <div style={{ color: 'var(--color-accent-red)', fontWeight: 'bold', fontSize: '1.5rem', marginTop: '1rem', zIndex: 10 }}>
                Crashed!
              </div>
            )}
            
            {round?.serverSeedHash && (
              <div className="provably-fair-info">
                Provably Fair Hash: <span className="hash-text">{round.serverSeedHash}</span>
              </div>
            )}
          </div>
        </section>
        
      </main>
    </>
  )
}
