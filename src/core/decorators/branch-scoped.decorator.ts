import { SetMetadata } from "@nestjs/common";
import { BRANCH_SCOPED_KEY } from "../guards/branch-scope.guard";

export const BranchScoped = () => SetMetadata(BRANCH_SCOPED_KEY, true);
