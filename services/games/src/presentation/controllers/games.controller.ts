import { Controller, Get } from "@nestjs/common";
import type { HealthCheckResponse } from "@crash/contracts";

@Controller()
export class GamesController {
  @Get("health")
  check(): HealthCheckResponse {
    return { status: "ok", service: "games" };
  }
}
