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

        if (user.role === UserRoles.SUPERADMIN) return true;


        const paramBranchId = Number(request.params.branchId || request.query.branchId);
        if (paramBranchId && paramBranchId !== user.branchId) {
            throw new ForbiddenException('Доступ запрещен: не тот склад');
        }

        request.branchIdScope = user.branchId;
        return true;
    }
}
