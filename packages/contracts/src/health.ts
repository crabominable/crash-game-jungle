export type ServiceName = "frontend" | "games" | "wallets"

export interface HealthCheckResponse {
  service: ServiceName
  status: "ok"
}
