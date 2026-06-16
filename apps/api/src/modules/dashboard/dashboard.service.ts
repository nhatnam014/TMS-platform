import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import type { DashboardStats } from "@tms/shared";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [totalTrips, completed, inTransit, totalVehicleRecords, expiring] =
      await Promise.all([
        this.prisma.tripPlan.count({ where: { tripDate: { gte: today, lt: tomorrow } } }),
        this.prisma.tripPlan.count({ where: { tripDate: { gte: today, lt: tomorrow }, status: "COMPLETED" } }),
        this.prisma.tripPlan.count({ where: { tripDate: { gte: today, lt: tomorrow }, status: "IN_TRANSIT" } }),
        this.prisma.vehicleRecord.count(),
        this.prisma.vehicleRecord.count({
          where: {
            OR: [
              { hanDangKiem: { gte: today, lte: thirtyDaysFromNow } },
              { hanBaoHiem: { gte: today, lte: thirtyDaysFromNow } },
              { hanCaVet: { gte: today, lte: thirtyDaysFromNow } },
            ],
          },
        }),
      ]);

    return {
      totalTripsToday: totalTrips,
      tripsCompleted: completed,
      tripsInTransit: inTransit,
      vehiclesActive: totalVehicleRecords,
      vehiclesInMaintenance: 0,
      expiringCompliance: expiring,
    };
  }
}
