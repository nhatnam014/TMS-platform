import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { ENTITY_TYPES } from "@tms/shared";
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginationQuery,
  PaginatedResponse,
  BulkDeleteResult,
} from "@tms/shared";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    search: string | undefined,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedResponse<any>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { isActive: true };
    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { code: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: s, mode: Prisma.QueryMode.insensitive } },
        { taxCode: { contains: s, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          taxCode: true,
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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

  async bulkDelete(ids: string[]): Promise<BulkDeleteResult> {
    const deleted: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const existing = await tx.customer.findUnique({ where: { id } });
        if (!existing) {
          skipped.push({ id, reason: "Not found" });
          continue;
        }

        const tripPlanCount = await tx.tripPlan.count({ where: { customerId: id } });
        if (tripPlanCount > 0) {
          skipped.push({
            id,
            reason: `Referenced by ${tripPlanCount} trip plan(s)`,
          });
          continue;
        }

        await tx.customer.delete({ where: { id } });

        await this.auditService.log(
          {
            action: "DELETE",
            entityType: ENTITY_TYPES.CUSTOMER,
            entityId: id,
            summary: `Deleted customer: ${existing.code} — ${existing.name}`,
            beforeSnapshot: existing as object,
          },
          tx,
        );

        deleted.push(id);
      }
    });

    return { deleted, skipped };
  }
}
