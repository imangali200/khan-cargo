import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BranchEntity } from "src/core/db/entities/branch.entity";
import { UserEntity } from "src/core/db/entities/user.entity";
import { BranchService } from "./branch.service";
import { BranchController } from "./branch.controller";

@Module({
    imports: [TypeOrmModule.forFeature([BranchEntity, UserEntity])],
    controllers: [BranchController],
    providers: [BranchService],
    exports: [BranchService],
})
export class BranchModule { }
