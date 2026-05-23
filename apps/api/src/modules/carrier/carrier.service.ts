import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { ENTITY_TYPES } from "@tms/shared";
import type { CreateCarrierDto, UpdateCarrierDto } from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CarrierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.carrier.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, phone: true },
      orderBy: { name: "asc" },
    });
  }

  async create(dto: CreateCarrierDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const carrier = await tx.carrier.create({
          data: {
            code: dto.code,
            name: dto.name,
            phone: dto.phone,
          },
        });

        await this.auditService.log(
          {
            action: "CREATE",
            entityType: ENTITY_TYPES.CARRIER,
            entityId: carrier.id,
            summary: `Created carrier: ${carrier.code} — ${carrier.name}`,
            afterSnapshot: carrier as object,
          },
          tx,
        );

        return carrier;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Carrier code "${dto.code}" is already in use`);
        }
        throw e;
      }
    });
  }

  async update(id: string, dto: UpdateCarrierDto) {
    const existing = await this.prisma.carrier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Carrier ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      try {
        const carrier = await tx.carrier.update({
          where: { id },
          data: dto,
        });

        await this.auditService.log(
          {
            action: "UPDATE",
            entityType: ENTITY_TYPES.CARRIER,
            entityId: id,
            summary: `Updated carrier: ${carrier.code}`,
            beforeSnapshot: existing as object,
            afterSnapshot: carrier as object,
          },
          tx,
        );

        return carrier;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Carrier code "${dto.code}" is already in use`);
        }
        throw e;
      }
    });
  }
}
