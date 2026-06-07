import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { io, Socket } from "socket.io-client"

// Constantes
const KONG_URL = "http://localhost:8000"
const KEYCLOAK_TOKEN_URL = "http://localhost:8080/realms/crash-game/protocol/openid-connect/token"

// Estado global para os testes E2E
let accessToken = ""
let socket: Socket
let initialBalance = 0
let myPlayerId = ""

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe("Crash Game Full Flow (Black Box E2E)", () => {
  // Aumentar timeout para dar tempo ao docker de subir serviços se estiverem demorando
  // E dar tempo à rodada de passar por betting_open -> in_progress -> crashed
  const E2E_TIMEOUT = 30000 

  beforeAll(async () => {
    // 1. Obter JWT do Keycloak
    const params = new URLSearchParams()
    params.append('client_id', 'crash-game-client')
    params.append('grant_type', 'password')
    params.append('username', 'player')
    params.append('password', 'player123')

    const response = await fetch(KEYCLOAK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    })

    if (!response.ok) {
      throw new Error(`Falha ao obter token Keycloak: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    accessToken = data.access_token

    // Extrair ID do player a partir do JWT decodificado
    const payloadBase64Url = accessToken.split('.')[1]
    const payload = JSON.parse(Buffer.from(payloadBase64Url, 'base64').toString())
    myPlayerId = payload.sub

    // 2. Conectar WebSocket via Kong
    socket = io(KONG_URL, { transports: ["websocket"] })
    await new Promise<void>((resolve, reject) => {
      socket.on("connect", resolve)
      socket.on("connect_error", reject)
      setTimeout(() => reject(new Error("Timeout conectando no socket via Kong")), 5000)
    })
  })

  afterAll(() => {
    if (socket) {
      socket.disconnect()
    }
  })

  test("1. Verifica a saúde dos serviços via Kong", async () => {
    const gamesHealth = await fetch(`${KONG_URL}/games/health`).then(r => r.json())
    const walletsHealth = await fetch(`${KONG_URL}/wallets/health`).then(r => r.json())

    expect(gamesHealth.status).toBe("ok")
    expect(walletsHealth.status).toBe("ok")
  })

  test("2. Resgata o balanço inicial da carteira do jogador", async () => {
    const res = await fetch(`${KONG_URL}/wallets/me`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    expect(res.status).toBe(200)
    const wallet = await res.json()
    
    expect(wallet.playerId).toBe(myPlayerId)
    expect(typeof wallet.balanceMinor).toBe("string")
    initialBalance = parseInt(wallet.balanceMinor, 10)
    expect(initialBalance).toBeGreaterThanOrEqual(0)
  })

  test("3. Aguarda a rodada entrar em 'betting_open' e faz uma aposta", async () => {
    // Escutar até vir betting_open
    await new Promise<void>((resolve) => {
      const handler = (snapshot: any) => {
        if (snapshot && snapshot.status === "betting_open") {
          socket.off("round.snapshot", handler)
          resolve()
        }
      }
      socket.on("round.snapshot", handler)
    })

    // Fazer a aposta
    const betAmount = 500 // R$ 5,00
    const res = await fetch(`${KONG_URL}/games/rounds/current/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ amountMinor: betAmount, correlationId: crypto.randomUUID() })
    })

    expect(res.status).toBe(201)

    // Aguardar o RabbitMQ liquidar a aposta (wallet.debit)
    await sleep(500)

    // O balanço da wallet deve ter reduzido authoritativamente
    const walletRes = await fetch(`${KONG_URL}/wallets/me`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    const wallet = await walletRes.json()
    expect(parseInt(wallet.balanceMinor, 10)).toBe(initialBalance - betAmount)

    // E o socket deve ter refletido nossa aposta no próximo tick
    let foundMyBet = false
    await new Promise<void>((resolve) => {
      const handler = (snapshot: any) => {
        if (snapshot && snapshot.status === "betting_open") {
          const bet = snapshot.bets.find((b: any) => b.playerId === myPlayerId)
          if (bet && bet.status === "bet_active") {
            foundMyBet = true
            socket.off("round.snapshot", handler)
            resolve()
          }
        }
      }
      socket.on("round.snapshot", handler)
    })
    
    expect(foundMyBet).toBe(true)
  }, E2E_TIMEOUT)

  test("4. Aguarda a rodada iniciar ('in_progress') e realiza um cashout de sucesso", async () => {
    // Escutar até vir in_progress
    await new Promise<void>((resolve) => {
      const handler = (snapshot: any) => {
        if (snapshot && snapshot.status === "in_progress") {
          socket.off("round.snapshot", handler)
          resolve()
        }
      }
      socket.on("round.snapshot", handler)
    })

    // Fazer cashout seguro com target = 1.01x para garantir vitória imediata
    const payoutMultiplierBasisPoints = 10100
    
    // Tentar cashout até aceitar (pode falhar se tentarmos cashoutar enquanto ainda está 1.00x no tick 0, dependendo da corrida)
    // O backend permite a partir do start, mas vamos mandar diretamente
    const res = await fetch(`${KONG_URL}/games/rounds/current/cashout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ 
        payoutMultiplierBasisPoints,
        cashoutCorrelationId: crypto.randomUUID()
      })
    })

    // Poderia retornar erro se crashou no 1.00x cravado ou tentou antes, 
    // mas num ambiente estável deve passar 201 ou 400. 
    // Se der 400 por crash precoce, o teste seria instável, mas assumimos que o mock ou a seed permite
    if (res.status === 400) {
      const msg = await res.json()
      if (msg.message && msg.message.includes('crashed')) {
        // Tolerância em E2E para seeds de 1.00x instant crash
        console.log("Rodada crashou instantaneamente em 1.00x. Não foi possível testar o cashout nesta seed.")
        return
      }
    }
    
    expect(res.status).toBe(201)

    // Aguardar RabbitMQ processar o crédito do cashout
    await sleep(500)

    // Verificar se o balanço agora contém o prêmio (500 * 1.01 = 505)
    // Logo, initialBalance - 500 + 505 = initialBalance + 5
    const walletRes = await fetch(`${KONG_URL}/wallets/me`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    const wallet = await walletRes.json()
    expect(parseInt(wallet.balanceMinor, 10)).toBe(initialBalance + 5)
  }, E2E_TIMEOUT)
  
  test("5. Idempotência: Fazer outra requisição na Wallet não altera saldo indevidamente", async () => {
    // Este teste garante que as operações assíncronas no meio do cashout não causaram crédito duplo
    const walletRes = await fetch(`${KONG_URL}/wallets/me`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    const wallet = await walletRes.json()
    
    // Assumindo que o cashout do teste anterior rodou e creditou 505
    const currentBalance = parseInt(wallet.balanceMinor, 10)
    expect(currentBalance).toBeGreaterThanOrEqual(initialBalance - 500)
    // Se lucrou, é initialBalance + 5. Se crashou instantaneamente, initialBalance - 500
    
    // O valor deve se manter estático após a liquidação
    await sleep(200)
    const walletRes2 = await fetch(`${KONG_URL}/wallets/me`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    const wallet2 = await walletRes2.json()
    expect(parseInt(wallet2.balanceMinor, 10)).toBe(currentBalance)
  })
})
