import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { TripPlanService } from "../trip-plan/trip-plan.service";
import { buildBaoDuongXe } from "./builders/baoduong-xe.builder";
import { buildKeHoachXe } from "./builders/kehoach-xe.builder";
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
    const selectedUnits = units && units.length > 0 ? units : [];

    const where = selectedUnits.length > 0
      ? { loaiXe: { in: selectedUnits } }
      : {};

    const records = await this.prisma.vehicleMaintenanceRecord.findMany({
      where,
      orderBy: [{ loaiXe: "asc" }, { ngayLam: "asc" }],
      take: 10000,
    });

    return buildBaoDuongXe(records, selectedUnits);
  }
}
