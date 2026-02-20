import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from '../dto/create_user.dto';
import { LoginDto } from '../dto/login.dto';
import { access } from 'fs';
import { TokenService } from '../services/token.service';
import { RefreshTokenDto } from '../dto/refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    readonly tokenService: TokenService
  ) { }

  @Post('signUp')
  @ApiOperation({ summary: 'Регистрация' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created'
  })
  async registerUser(@Body() createUser: CreateUserDto) {
    return await this.authService.register(createUser)
  }

  @Post('signIn')
  @ApiOperation({ summary: 'login' })
  @ApiResponse({
    description: 'login has been successfull'
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'refresh token' })
  @ApiResponse({
    description: 'access token created successfully'
  })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return await this.tokenService.refreshToken(dto.refreshToken)
  }
}
