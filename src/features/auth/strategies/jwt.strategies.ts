import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

type JwtPayload = {
    sub: number;
    name: string;
    role: string;
    branchId: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('JWT_SECRET') || '',
            ignoreExpiration: false
        });
    }

    async validate(payload: JwtPayload) {
        return {
            sub: payload.sub,
            name: payload.name,
            role: payload.role,
            branchId: payload.branchId,
        };
    }
}