import { Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Auth } from "src/core/decorators/auth.decorators";
import { BranchScoped } from "src/core/decorators/branch-scoped.decorator";
import { CurrentUser } from "src/core/decorators/current-user.decorator";
import { UserRoles } from "src/core/db/enums/user_roles";
import { TrackingStatus } from "src/core/db/enums/tracking-status.enum";
import { TrackingService } from "./tracking.service";
import { ExcelImportService } from "./excel-import.service";
import { CreateTrackingDto } from "./dto/create-tracking.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { TrackingFilterDto } from "./dto/tracking-filter.dto";
import { QuickUpdateDto } from "./dto/quick-update.dto";

@Controller('tracking')
@ApiTags('Tracking')
export class TrackingController {
    constructor(
        private readonly trackingService: TrackingService,
        private readonly excelImportService: ExcelImportService,
    ) { }

    @Post()
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Create tracking item (branchId auto-set from user)' })
    async create(@Body() dto: CreateTrackingDto, @CurrentUser() user: any) {
        return this.trackingService.create(dto, user);
    }

    @Get()
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @BranchScoped()
    @ApiOperation({ summary: 'List tracking items (branch-scoped for ADMIN)' })
    async findAll(@Query() query: TrackingFilterDto, @Req() req: any) {
        const branchId = req.branchIdScope;
        return this.trackingService.findAll(query, branchId);
    }

    @Get('search')
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Search tracking item by code' })
    @ApiQuery({ name: 'trackingCode', required: true, example: 'KH-001' })
    async searchByCode(@Query('trackingCode') trackingCode: string) {
        return this.trackingService.searchByCode(trackingCode);
    }

    @Get('dashboard')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @BranchScoped()
    @ApiOperation({ summary: 'Dashboard: counts by status (branch-scoped for ADMIN)' })
    async dashboard(@Req() req: any) {
        const branchId = req.branchIdScope;
        return this.trackingService.getDashboard(branchId);
    }

    @Get('import/logs')
    @Auth([UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Get import logs (SUPERADMIN only)' })
    async importLogs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.excelImportService.getImportLogs(
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
        );
    }

    @Get(':id')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @BranchScoped()
    @ApiOperation({ summary: 'Get tracking item by ID (branch-scoped)' })
    async findOne(@Param('id') id: number, @Req() req: any) {
        const branchId = req.branchIdScope;
        return this.trackingService.findOne(id, branchId);
    }

    @Patch(':id/status')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @BranchScoped()
    @ApiOperation({ summary: 'Update status (ADMIN: READY_FOR_PICKUP/PICKED_UP only, own branch)' })
    async updateStatus(
        @Param('id') id: number,
        @Body() dto: UpdateStatusDto,
        @CurrentUser() user: any,
        @Req() req: any,
    ) {
        const branchId = req.branchIdScope;
        return this.trackingService.updateStatus(id, dto, user, branchId);
    }

    @Post('import')
    @Auth([UserRoles.SUPERADMIN])
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                targetStatus: {
                    type: 'string',
                    enum: Object.values(TrackingStatus),
                }
            },
        },
    })
    @ApiOperation({ summary: 'Excel import: bulk update statuses (SUPERADMIN only)' })
    async importExcel(
        @UploadedFile() file: Express.Multer.File,
        @Body('targetStatus') targetStatus: TrackingStatus,
        @CurrentUser() user: any,
    ): Promise<any> {
        return this.excelImportService.processImport(file, targetStatus, user.sub);
    }

    @Post('sync')
    @Auth([UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Sync all tracking items with master list arrivals (SUPERADMIN only)' })
    async syncTracks() {
        return this.trackingService.syncAllWithMaster();
    }

    @Get('master/list')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Get all master tracking items (ADMIN/SUPERADMIN)' })
    async getMasterItems(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.excelImportService.findMasterItems(
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
        );
    }

    @Get('master/search')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Search master tracking items by code' })
    async searchMasterItems(@Query('trackingCode') trackingCode: string) {
        return this.excelImportService.searchMasterItems(trackingCode);
    }

    @Post('master/status')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Update status for a tracking code in master list and sync with users' })
    async updateMasterStatus(
        @Body('trackingCode') trackingCode: string,
        @Body('status') status: TrackingStatus,
        @CurrentUser() user: any,
    ) {
        return this.excelImportService.updateMasterStatus(trackingCode, status, user.sub);
    }

    @Patch('quick-update')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Admin Quick Update: By tracking code (ideal for scanner)' })
    async quickUpdate(
        @Body() dto: QuickUpdateDto,
        @CurrentUser() user: any,
    ) {
        return this.trackingService.quickUpdateByCode(dto, user);
    }

    @Post('notify-arrivals')
    @Auth([UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Manually trigger Telegram invoices for all arrived items in current branch' })
    async notifyArrivals(@CurrentUser() user: any) {
        return this.trackingService.sendBranchNotifications(user);
    }
}
