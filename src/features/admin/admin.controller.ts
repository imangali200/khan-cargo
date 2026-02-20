import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Auth } from 'src/core/decorators/auth.decorators';
import { UserRoles } from 'src/core/db/enums/user_roles';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from 'src/core/db/entities/user.entity';
import { UserService } from '../auth/services/user.service';
import { CreateUserDto } from './dto/create_user.dto';
import { UpdateUserDto } from './dto/update_user.dto';
import { ResetPasswordDto } from "./dto/reset_password.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { SettingsEntity } from "src/core/db/entities/settings.entity";
import { Repository } from "typeorm";

@Controller('admin')
@ApiTags('Admin - User Management')
@Auth([UserRoles.SUPERADMIN])
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
    @InjectRepository(SettingsEntity)
    private readonly settingsRepo: Repository<SettingsEntity>,
  ) { }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (paginated, searchable)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return await this.userService.findAllUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      search
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ type: UserEntity })
  async getUser(@Param('id') id: number): Promise<UserEntity> {
    return await this.userService.findUser(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user (with role and branch)' })
  @ApiResponse({ type: UserEntity })
  async createUser(@Body() createDto: CreateUserDto): Promise<UserEntity> {
    return await this.userService.createUser(createDto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ type: UserEntity })
  async updateUser(@Param('id') id: number, @Body() updateDto: UpdateUserDto): Promise<UserEntity> {
    return await this.userService.updateUser(id, updateDto);
  }

  @Patch('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password (never returns old password)' })
  async resetPassword(@Param('id') id: number, @Body() passwordDto: ResetPasswordDto) {
    return await this.userService.resetPassword(id, passwordDto.newPassword);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft delete user' })
  async deleteUser(@Param('id') id: number) {
    return await this.userService.deletedUser(id);
  }


  @Post('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user activation (Active <-> Inactive)' })
  async toggleUserStatus(@Param('id') id: number) {
    return await this.userService.toggleUserStatus(id);
  }

  @Get('settings')
  @Auth([UserRoles.SUPERADMIN])
  @ApiOperation({ summary: 'Get global settings (Price, Dollar rate)' })
  async getSettings() {
    return this.settingsRepo.find();
  }

  @Patch('settings/:key')
  @Auth([UserRoles.SUPERADMIN])
  @ApiOperation({ summary: 'Update global setting' })
  async updateSetting(@Param('key') key: string, @Body('value') value: string) {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepo.create({ key, value });
    } else {
      setting.value = value;
    }
    return this.settingsRepo.save(setting);
  }
}
