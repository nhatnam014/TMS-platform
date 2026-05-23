import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { ENTITY_TYPES } from "@tms/shared";
import type { CreateCustomerDto, UpdateCustomerDto } from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, address: true, phone: true, email: true, taxCode: true },
      orderBy: { name: "asc" },
    });
  }

  async create(dto: CreateCustomerDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const customer = await tx.customer.create({
          data: {
            code: dto.code,
            name: dto.name,
            address: dto.address,
            phone: dto.phone,
            email: dto.email,
            taxCode: dto.taxCode,
          },
        });

        await this.auditService.log(
          {
            action: "CREATE",
            entityType: ENTITY_TYPES.CUSTOMER,
            entityId: customer.id,
            summary: `Created customer: ${customer.code} — ${customer.name}`,
            afterSnapshot: customer as object,
          },
          tx,
        );

        return customer;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Customer code "${dto.code}" is already in use`);
        }
        throw e;
      }
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Customer ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      try {
        const customer = await tx.customer.update({
          where: { id },
          data: dto,
        });

        await this.auditService.log(
          {
            action: "UPDATE",
            entityType: ENTITY_TYPES.CUSTOMER,
            entityId: id,
            summary: `Updated customer: ${customer.code}`,
            beforeSnapshot: existing as object,
            afterSnapshot: customer as object,
          },
          tx,
        );

        return customer;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException(`Customer code "${dto.code}" is already in use`);
        }
        throw e;
      }
    });
  }
}
