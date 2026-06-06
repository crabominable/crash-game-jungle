import type { HealthCheckResponse } from "@crash/contracts"
import { Controller, Get } from "@nestjs/common"

@Controller()
export class GamesController {
  @Get("health")
  check(): HealthCheckResponse {
    return { status: "ok", service: "games" }
  }
}
