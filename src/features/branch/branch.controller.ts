import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Auth } from "src/core/decorators/auth.decorators";
import { UserRoles } from "src/core/db/enums/user_roles";
import { BranchEntity } from "src/core/db/entities/branch.entity";
import { BranchService } from "./branch.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";

@Controller('branches')
@ApiTags('Branches')
export class BranchController {
    constructor(private readonly branchService: BranchService) { }

    @Get()
    @ApiOperation({ summary: 'Get all branches' })
    @ApiResponse({ type: [BranchEntity] })
    async findAll(): Promise<BranchEntity[]> {
        return this.branchService.findAll();
    }

    @Get(':name')
    @Auth([UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Search branches by name (partial match)' })
    @ApiResponse({ type: [BranchEntity] })
    async findOne(@Param('name') name: string): Promise<BranchEntity[]> {
        return this.branchService.findByName(name);
    }

    @Post()
    @Auth([UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Create a new branch' })
    @ApiResponse({ type: BranchEntity })
    async create(@Body() dto: CreateBranchDto): Promise<BranchEntity> {
        return this.branchService.create(dto);
    }

    @Patch(':id')
    @Auth([UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Update branch' })
    @ApiResponse({ type: BranchEntity })
    async update(@Param('id') id: number, @Body() dto: UpdateBranchDto): Promise<BranchEntity> {
        return this.branchService.update(id, dto);
    }

    @Delete(':id')
    @Auth([UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Soft delete branch' })
    async remove(@Param('id') id: number) {
        await this.branchService.remove(id);
        return { message: 'Branch deleted successfully (soft-delete)' };
    }

    @Delete(':id/permanent')
    @Auth([UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Permanent delete branch (SUPERADMIN only)' })
    async permanentRemove(@Param('id') id: number) {
        await this.branchService.permanentRemove(id);
        return { message: 'Branch permanently deleted' };
    }
}
