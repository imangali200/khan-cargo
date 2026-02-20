import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRoles } from "../db/enums/user_roles";

export const BRANCH_SCOPED_KEY = 'branchScoped';

@Injectable()
export class BranchScopeGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isBranchScoped = this.reflector.getAllAndOverride<boolean>(
            BRANCH_SCOPED_KEY,
            [context.getClass(), context.getHandler()]
        );
        if (!isBranchScoped) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // SUPERADMIN bypasses branch scope
        if (user.role === UserRoles.SUPERADMIN) return true;

        // For ADMIN/USER: check branch match and inject scope
        const paramBranchId = Number(request.params.branchId || request.query.branchId);
        if (paramBranchId && paramBranchId !== user.branchId) {
            throw new ForbiddenException('Access denied: branch scope violation');
        }

        // Auto-set branchId scope for downstream use
        request.branchIdScope = user.branchId;
        return true;
    }
}
