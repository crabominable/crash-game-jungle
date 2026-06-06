import type { HealthCheckResponse } from "@crash/contracts"
import { Controller, Get } from "@nestjs/common"

@Controller()
export class WalletsController {
  @Get("health")
  check(): HealthCheckResponse {
    return { status: "ok", service: "wallets" }
  }
}
