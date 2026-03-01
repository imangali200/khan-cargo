import { Body, Controller, Get, Patch, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Auth } from "src/core/decorators/auth.decorators";
import { CurrentUser } from "src/core/decorators/current-user.decorator";
import { UserRoles } from "src/core/db/enums/user_roles";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller('profile')
@ApiTags('Profile')
@Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    @ApiOperation({ summary: 'Get own profile' })
    async getProfile(@CurrentUser('sub') userId: number) {
        return this.profileService.getProfile(userId);
    }

    @Patch()
    @ApiOperation({ summary: 'Update own profile (name, lastName, email, branchId)' })
    async updateProfile(
        @CurrentUser('sub') userId: number,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.profileService.updateProfile(userId, dto);
    }

    @Get('posts')
    @ApiOperation({ summary: 'Get own posts' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getMyPosts(
        @CurrentUser('sub') userId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.profileService.getMyPosts(userId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }

    @Get('liked')
    @ApiOperation({ summary: 'Get liked posts' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getLikedPosts(
        @CurrentUser('sub') userId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.profileService.getLikedPosts(userId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }

    @Get('tracking')
    @ApiOperation({ summary: 'Get own tracking items' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getMyTracking(
        @CurrentUser('sub') userId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.profileService.getMyTrackingItems(userId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }

    @Get('trackingArchive')
    @ApiOperation({ summary: 'Get archive tracks' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getMyArchiveTracking(
        @CurrentUser('sub') userId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.profileService.getMyArchiveTracking(userId, page ? Number(page) : 1, limit ? Number(limit) : 20)
    }
}
