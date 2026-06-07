import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common"
import type { JwtPayload } from "@crash/contracts"

export const PlayerId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    if (!user || !user.sub) {
      throw new UnauthorizedException("Player ID not found in request")
    }

    return user.sub
  }
)
