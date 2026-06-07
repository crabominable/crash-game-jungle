import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import request from "supertest"
import { expect, test, describe, beforeAll, afterAll } from "bun:test"
import { AppModule } from "../../src/app.module"

import { RabbitMqWalletsSettlementIntegration } from "../../src/infrastructure/messaging/rabbitmq-wallets-settlement.integration"

describe("WalletsController (e2e)", () => {
  let app: INestApplication

  beforeAll(async () => {
    process.env.RABBITMQ_URL = "amqp://localhost"
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMqWalletsSettlementIntegration)
      .useValue({
        onModuleInit: () => {},
        publishBetDebitConfirmed: () => {},
        publishBetDebitRejected: () => {},
        publishCashoutCreditConfirmed: () => {},
        publishCashoutCreditRejected: () => {}
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
    expect(response.body).toEqual({ status: "ok", service: "wallets" })
  })

  test("/me (GET) should require authentication", async () => {
    const response = await request(app.getHttpServer()).get("/me")
    expect(response.status).toBe(401) // Unauthorized
  })
})
