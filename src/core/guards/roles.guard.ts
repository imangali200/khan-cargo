import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { UserRoles } from "../db/enums/user_roles";

export const ROLES_KEY = 'roles'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRoles[]>(
            ROLES_KEY,
            [context.getClass(), context.getHandler()]
        )
        if (!requiredRoles || requiredRoles.length === 0) {
            return true
        }

        const { user } = context.switchToHttp().getRequest()
        return requiredRoles.includes(user.role)
    }
}