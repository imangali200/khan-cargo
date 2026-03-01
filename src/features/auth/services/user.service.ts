import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/core/db/entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "../dto/create_user.dto";
import { UpdateUserDto } from "src/features/admin/dto/update_user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) { }

    async findUser(userId: number): Promise<UserEntity> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['branch']
        });
        if (!user) throw new NotFoundException('Пользователь не найден');
        return user;
    }

    async findAllUsers(page: number, limit: number, search?: string) {
        const qb = this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.branch', 'branch');

        if (search) {
            qb.where(
                '(user.name ILIKE :search OR user.lastName ILIKE :search OR user.phoneNumber ILIKE :search OR user.telegramUsername ILIKE :search OR user.userCode ILIKE :search OR CAST(user.id AS TEXT) = :exactSearch)',
                { search: `%${search}%`, exactSearch: search }
            );
        }

        qb.orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                page,
                limit,
                total,
                lastPage: Math.ceil(total / limit),
            }
        };
    }

    async createUser(createDto: CreateUserDto): Promise<UserEntity> {
        const phoneExists = await this.userRepository.findOne({ where: { phoneNumber: createDto.phoneNumber } });
        if (phoneExists) throw new ConflictException('Пользователь с таким номером телефона уже существует');

        const codeExists = await this.userRepository.findOne({ where: { userCode: createDto.userCode } });
        if (codeExists) throw new ConflictException(`Пользователь с кодом ${createDto.userCode} уже существует`);

        if (createDto.telegramUsername) {
            const usernameExists = await this.userRepository.findOne({ where: { telegramUsername: createDto.telegramUsername } });
            if (usernameExists) throw new ConflictException('Пользователь с таким Telegram ником уже существует');
        }

        const hashPassword = await bcrypt.hash(createDto.password, 10);
        const newUser = this.userRepository.create({
            ...createDto,
            password: hashPassword,
        });
        return await this.userRepository.save(newUser);
    }

    async updateUser(userId: number, updateDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Пользователь не найден');

        const merged = this.userRepository.merge(user, updateDto);
        return await this.userRepository.save(merged);
    }

    async resetPassword(userId: number, newPassword: string): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Пользователь не найден');

        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);
        return { message: 'Password reset successfully' };
    }

    async deletedUser(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Пользователь не найден');
        return await this.userRepository.softDelete(userId);
    }

    async toggleUserStatus(userId: number): Promise<UserEntity> {
        const user = await this.findUser(userId);
        user.isActive = !user.isActive;
        return await this.userRepository.save(user);
    }
    async updateProfilePhoto(userId: number, photoUrl: string, publicId: string): Promise<UserEntity> {
        const user = await this.findUser(userId);
        user.profilePhotoUrl = photoUrl;
        user.profilePhotoPublicId = publicId;
        return await this.userRepository.save(user);
    }
}