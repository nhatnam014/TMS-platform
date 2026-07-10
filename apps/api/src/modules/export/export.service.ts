import { Injectable } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { PrismaService } from "../../config/prisma.service";
import { TripPlanService } from "../trip-plan/trip-plan.service";
import { buildBaoDuongXe } from "./builders/baoduong-xe.builder";
import { buildKeHoachXe } from "./builders/kehoach-xe.builder";
import { buildLenhBai } from "./builders/lenh-bai.builder";
import { buildQuanLyXe } from "./builders/quanly-xe.builder";

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tripPlanService: TripPlanService,
  ) {}

  async exportTripPlans(from?: string, to?: string): Promise<Buffer> {
    const result = await this.tripPlanService.findAll(
      { dateFrom: from, dateTo: to },
      { page: 1, limit: 10000 },
    );
    return buildKeHoachXe(result.data, from, to);
  }

  async exportVehicles(): Promise<Buffer> {
    const records = await this.prisma.vehicleRecord.findMany({
      include: { moocs: true },
      orderBy: { createdAt: "asc" },
    });
    return buildQuanLyXe(records);
  }

  async exportVehicleMaintenance(units?: string[]): Promise<Buffer> {
    const selectedLoaiXe = units && units.length > 0 ? units : [];

    const where = selectedLoaiXe.length > 0
      ? { loaiXe: { in: selectedLoaiXe } }
      : {};

    const records = await this.prisma.vehicleRecord.findMany({
      where,
      orderBy: [{ loaiXe: "asc" }, { createdAt: "asc" }],
      take: 10000,
      include: { kmRounds: { orderBy: { roundNumber: "asc" } } },
    });

    return buildBaoDuongXe(records, selectedLoaiXe);
  }

  async exportYardMoves(
    from?: string,
    to?: string,
    daKeoStatus?: "hauled" | "pending",
  ): Promise<Buffer> {
    const where: Prisma.YardMoveWhereInput = { isActive: true };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (daKeoStatus === "hauled") {
      where.AND = [{ daKeo: { not: null } }, { NOT: { daKeo: "" } }];
    } else if (daKeoStatus === "pending") {
      where.OR = [{ daKeo: null }, { daKeo: "" }];
    }

    const records = await this.prisma.yardMove.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return buildLenhBai(records, from, to);
  }
}
