import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { expect, test, describe, beforeAll, afterAll } from "bun:test"
import { AppModule } from "../../src/app.module"

import { RabbitMqGamesSettlementIntegration } from "../../src/infrastructure/messaging/rabbitmq-games-settlement.integration"

describe("GamesController (e2e)", () => {
  let app: INestApplication

  beforeAll(async () => {
    process.env.RABBITMQ_URL = "amqp://localhost"
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMqGamesSettlementIntegration)
      .useValue({
        onModuleInit: () => {},
        publishBetDebitRequest: () => {},
        publishCashoutCreditRequest: () => {}
      })
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test("/health (GET) should not require authentication", async () => {
    const response = await request(app.getHttpServer()).get("/health")
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: "ok", service: "games" })
  })

  test("/rounds/current (GET) should require authentication", async () => {
    const response = await request(app.getHttpServer()).get("/rounds/current")
    expect(response.status).toBe(401) // Unauthorized
  })

  test("/rounds/current/bets (POST) should require authentication", async () => {
    const response = await request(app.getHttpServer()).post("/rounds/current/bets").send({
      amountMinor: 1000,
      correlationId: "abc"
    })
    expect(response.status).toBe(401) // Unauthorized
  })

  test("/rounds/current/cashout (POST) should require authentication", async () => {
    const response = await request(app.getHttpServer()).post("/rounds/current/cashout").send({
      cashoutCorrelationId: "def",
      payoutMultiplierBasisPoints: 15000
    })
    expect(response.status).toBe(401) // Unauthorized
  })
})
