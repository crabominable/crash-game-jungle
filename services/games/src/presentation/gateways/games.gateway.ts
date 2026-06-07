import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { GetCurrentRoundService } from "../../application/get-current-round.service"
import { OnEvent } from "@nestjs/event-emitter"
import type { RoundSnapshot } from "../../application/round.snapshot"

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class GamesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server

  constructor(private readonly getCurrentRoundService: GetCurrentRoundService) {}

  async handleConnection(client: Socket) {
    try {
      const snapshot = await this.getCurrentRoundService.execute()
      client.emit("round.snapshot", snapshot)
    } catch (error: any) {
      if (error.name === "CurrentRoundNotFoundError") {
        client.emit("round.snapshot", null)
      } else {
        console.error("Error fetching current round on WS connection:", error)
      }
    }
  }

  @OnEvent("round.updated")
  handleRoundUpdated(snapshot: RoundSnapshot) {
    this.server.emit("round.snapshot", snapshot)
  }
}
