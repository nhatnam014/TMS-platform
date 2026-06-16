import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { TripPlanService } from "../trip-plan/trip-plan.service";
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
}
