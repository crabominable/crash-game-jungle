import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { passportJwtSecret } from "jwks-rsa"
import type { JwtPayload } from "@crash/contracts"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "http://keycloak:8080/realms/crash-game/protocol/openid-connect/certs",
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ["RS256"],
    })
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Passport automatically verifies the signature. 
    // We return the payload so it's attached to the request (req.user)
    return payload
  }
}
