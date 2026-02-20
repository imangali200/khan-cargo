import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { UserRoles } from "../db/enums/user_roles";
import { ROLES_KEY, RolesGuard } from "../guards/roles.guard";
import { JwtAuthGuard } from "../guards/jwt_auth.guard";
import { BranchScopeGuard } from "../guards/branch-scope.guard";
import { ApiBearerAuth } from "@nestjs/swagger";

export const Auth = (roles: UserRoles[]) => {
    return applyDecorators(
        SetMetadata(ROLES_KEY, roles ?? Object.values(UserRoles)),
        UseGuards(JwtAuthGuard, RolesGuard, BranchScopeGuard),
        ApiBearerAuth(),
    )
}