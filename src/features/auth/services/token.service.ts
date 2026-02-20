import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/core/db/entities/user.entity";
import { UserService } from "./user.service";

type JwtPayload = {
    sub: number;
    name: string;
    role: string;
    branchId: number;
    isActive: boolean;
}

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private userService: UserService
    ) { }

    async createToken(user: UserEntity) {
        const payload: JwtPayload = {
            sub: user.id,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            isActive: user.isActive,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION')
        });
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION')
        });
        return { accessToken, refreshToken };
    }

    async refreshToken(refreshToken: string) {
        let payload: JwtPayload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.getOrThrow<string>('JWT_SECRET')
            });
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.userService.findUser(payload.sub);
        return await this.createToken(user);
    }
}