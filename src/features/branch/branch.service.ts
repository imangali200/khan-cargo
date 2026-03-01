import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BranchEntity } from "src/core/db/entities/branch.entity";
import { UserEntity } from "src/core/db/entities/user.entity";
import { ILike, Repository } from "typeorm";
import { UserRoles } from "src/core/db/enums/user_roles";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";

@Injectable()
export class BranchService {
    constructor(
        @InjectRepository(BranchEntity)
        private readonly branchRepo: Repository<BranchEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
    ) { }

    async findAll(): Promise<BranchEntity[]> {
        return this.branchRepo.find({ order: { name: 'ASC' } });
    }

    async findByName(name: string): Promise<BranchEntity[]> {
        return this.branchRepo.find({
            where: { name: ILike(`%${name}%`) },
            relations: ['admin']
        });
    }

    async create(dto: CreateBranchDto): Promise<BranchEntity> {
        const exists = await this.branchRepo.findOne({ where: { name: dto.name } });
        if (exists) throw new ConflictException('Склад с таким названием уже существует');

        if (dto.adminId) {
            const user = await this.userRepo.findOne({ where: { id: dto.adminId } });
            if (!user) throw new NotFoundException('Администратор не найден');
            if (user.role !== UserRoles.ADMIN) {
                throw new ConflictException('Выбранный пользователь не является администратором');
            }

            const existingBranch = await this.branchRepo.findOne({ where: { adminId: dto.adminId } });
            if (existingBranch) throw new ConflictException('Этот администратор уже привязан к другому складу');
        }

        const branch = this.branchRepo.create(dto);
        const saved = await this.branchRepo.save(branch);

        if (dto.adminId) {
            await this.userRepo.update(dto.adminId, { branchId: saved.id });
        }

        return saved;
    }

    async findOne(id: number) {
        const branch = await this.branchRepo.findOne({ where: { id } })
        if (!branch) throw new NotFoundException('Склад не найден')
        return branch
    }

    async update(id: number, dto: UpdateBranchDto): Promise<BranchEntity> {
        const branch = await this.findOne(id);

        if (dto.adminId) {
            const user = await this.userRepo.findOne({ where: { id: dto.adminId } });
            if (!user) throw new NotFoundException('Администратор не найден');
            if (user.role !== UserRoles.ADMIN) {
                throw new ConflictException('Выбранный пользователь не является администратором');
            }
        }

        const oldAdminId = branch.adminId;
        const merged = this.branchRepo.merge(branch, dto);
        const saved = await this.branchRepo.save(merged);

        if (dto.adminId && dto.adminId !== oldAdminId) {
            await this.userRepo.update(dto.adminId, { branchId: saved.id });
        }

        return saved;
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.branchRepo.softDelete(id);
    }

    async permanentRemove(id: number) {
        await this.findOne(id);
        return this.branchRepo.delete(id);
    }
}
