import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/core/db/entities/user.entity';
import { BranchEntity } from 'src/core/db/entities/branch.entity';
import { Repository } from 'typeorm';
import { UserRoles } from 'src/core/db/enums/user_roles';
import { CreateUserDto } from '../dto/create_user.dto';
import * as bcrypt from 'bcrypt'
import { LoginDto } from '../dto/login.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(BranchEntity)
        private readonly branchRepository: Repository<BranchEntity>,
        private readonly tokenService: TokenService
    ) { }

    async register(createDto: CreateUserDto) {
        const user = await this.userRepository.findOne({ where: { phoneNumber: createDto.phoneNumber } })
        if (user) throw new ConflictException('Пользователь с таким номером телефона уже существует');

        if (createDto.branchId) {
            const branch = await this.branchRepository.findOne({ where: { id: createDto.branchId } });
            if (!branch) throw new NotFoundException('Склад не найден');
        }

        const hashPassword = await bcrypt.hash(createDto.password, 10)
        const newUser = await this.userRepository.create({
            ...createDto,
            password: hashPassword,
            role: UserRoles.USER // Strictly USER for public sign-up
        })
        const savedUser = await this.userRepository.save(newUser)
        const tokens = await this.tokenService.createToken(savedUser)
        return tokens
    }

    async login(loginDto: LoginDto) {
        const user = await this.userRepository.findOne({ where: { phoneNumber: loginDto.phoneNumber } })
        if (!user) throw new NotFoundException('Пользователь не найден')

        const verifyPassword = await bcrypt.compare(loginDto.password, user.password)
        if (!verifyPassword) throw new BadRequestException('Неверный номер телефона или пароль')

        const tokens = await this.tokenService.createToken(user)
        return tokens
    }

}
