import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ENTITY_TYPES } from "@tms/shared";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const USER_SELECT = {
  id: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username: dto.username,
            passwordHash,
            role: dto.role as any,
          },
          select: USER_SELECT,
        });
        await this.auditService.log(
          {
            action: "CREATE",
            entityType: ENTITY_TYPES.USER,
            entityId: user.id,
            summary: `Created user: ${user.username} (${user.role})`,
            afterSnapshot: { username: user.username, role: user.role } as object,
          },
          tx,
        );
        return user;
      });
    } catch (err: any) {
      if (err?.code === "P2002") throw new ConflictException("Username already exists");
      throw err;
    }
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!existing) throw new NotFoundException("User not found");
    if (dto.isActive === false && actorId === id) {
      throw new ForbiddenException("Không thể tự vô hiệu hóa tài khoản của mình");
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(dto.role !== undefined && { role: dto.role as any }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
        select: USER_SELECT,
      });
      await this.auditService.log(
        {
          action: "UPDATE",
          entityType: ENTITY_TYPES.USER,
          entityId: id,
          summary: `Updated user: ${user.username}`,
          beforeSnapshot: existing as object,
          afterSnapshot: user as object,
        },
        tx,
      );
      return user;
    });
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
    if (!user) throw new NotFoundException("User not found");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash } });
      await this.auditService.log(
        {
          action: "UPDATE",
          entityType: ENTITY_TYPES.USER,
          entityId: id,
          summary: `Password reset for ${user.username}`,
          afterSnapshot: { username: user.username } as object,
        },
        tx,
      );
    });
    return { message: "Mật khẩu đã được đặt lại" };
  }
}
