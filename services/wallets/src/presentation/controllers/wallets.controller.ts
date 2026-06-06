import { Controller, Get } from "@nestjs/common";
import type { HealthCheckResponse } from "@crash/contracts";

@Controller()
export class WalletsController {
  @Get("health")
  check(): HealthCheckResponse {
    return { status: "ok", service: "wallets" };
  }
}
