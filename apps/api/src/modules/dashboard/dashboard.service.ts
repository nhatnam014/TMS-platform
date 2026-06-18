import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import type { DashboardStats, ExpiryItem, TripsTrendItem } from "@tms/shared";

function toDateRange(from?: string, to?: string, defaultDays = 0): { gte: Date; lte: Date } {
  const start = from ? new Date(from) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = to ? new Date(to) : new Date();
  if (!to && defaultDays > 0) end.setDate(end.getDate() + defaultDays);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(tripFrom?: string, tripTo?: string): Promise<DashboardStats> {
    const tripRange = toDateRange(tripFrom, tripTo);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const today29 = new Date();
    today29.setDate(today29.getDate() + 29);
    today29.setHours(23, 59, 59, 999);

    const [
      totalTrips,
      tripsWaiting,
      tripsInTransit,
      tripsCompleted,
      tripsCancelled,
      vehiclesActiveGroups,
      moocsActive,
      urgentDangKiemXeGroups,
      urgentCaVetXeGroups,
      urgentDangKiemMooc,
      urgentCaVetMooc,
      expiringDangKiemXeGroups,
      expiringCaVetXeGroups,
      expiringDangKiemMooc,
      expiringCaVetMooc,
    ] = await Promise.all([
      this.prisma.tripPlan.count({
        where: { tripDate: tripRange },
      }),
      this.prisma.tripPlan.count({
        where: {
          tripDate: tripRange,
          status: { in: ["PLANNED", "DISPATCHED"] },
        },
      }),
      this.prisma.tripPlan.count({
        where: { tripDate: tripRange, status: "IN_TRANSIT" },
      }),
      this.prisma.tripPlan.count({
        where: { tripDate: tripRange, status: "COMPLETED" },
      }),
      this.prisma.tripPlan.count({
        where: { tripDate: tripRange, status: "CANCELLED" },
      }),
      // Distinct non-null bienSo for active vehicles
      this.prisma.vehicleRecord.groupBy({
        by: ["bienSo"],
        where: { bienSo: { not: null } },
      }),
      this.prisma.vehicleRecordMooc.count(),
      // Urgent: expired or expiring today
      this.prisma.vehicleRecord.groupBy({
        by: ["bienSo"],
        where: { bienSo: { not: null }, hanDangKiem: { lte: today } },
      }),
      this.prisma.vehicleRecord.groupBy({
        by: ["bienSo"],
        where: { bienSo: { not: null }, hanCaVet: { lte: today } },
      }),
      this.prisma.vehicleRecordMooc.count({
        where: { hanDangKiem: { lte: today } },
      }),
      this.prisma.vehicleRecordMooc.count({
        where: { hanCaVet: { lte: today } },
      }),
      // Warning: expired or expiring within 29 days
      this.prisma.vehicleRecord.groupBy({
        by: ["bienSo"],
        where: { bienSo: { not: null }, hanDangKiem: { lte: today29 } },
      }),
      this.prisma.vehicleRecord.groupBy({
        by: ["bienSo"],
        where: { bienSo: { not: null }, hanCaVet: { lte: today29 } },
      }),
      this.prisma.vehicleRecordMooc.count({
        where: { hanDangKiem: { lte: today29 } },
      }),
      this.prisma.vehicleRecordMooc.count({
        where: { hanCaVet: { lte: today29 } },
      }),
    ]);

    return {
      totalTrips,
      tripsWaiting,
      tripsInTransit,
      tripsCompleted,
      tripsCancelled,
      vehiclesActive: vehiclesActiveGroups.length,
      moocsActive,
      urgentDangKiemXe: urgentDangKiemXeGroups.length,
      urgentCaVetXe: urgentCaVetXeGroups.length,
      urgentDangKiemMooc,
      urgentCaVetMooc,
      expiringDangKiemXe: expiringDangKiemXeGroups.length,
      expiringCaVetXe: expiringCaVetXeGroups.length,
      expiringDangKiemMooc,
      expiringCaVetMooc,
    };
  }

  async getTripsTrend(from: string, to: string): Promise<TripsTrendItem[]> {
    const range = toDateRange(from, to);
    const trips = await this.prisma.tripPlan.findMany({
      where: { tripDate: range },
      select: { tripDate: true },
    });

    const countByDate = new Map<string, number>();
    for (const t of trips) {
      const key = isoDate(new Date(t.tripDate));
      countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    }

    return Array.from(countByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  async getExpiryList(
    from?: string,
    to?: string,
    entity: "all" | "xe" | "mooc" = "all",
    type: "all" | "dangkiem" | "cavet" = "all",
  ): Promise<ExpiryItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeEnd = to ? new Date(to) : new Date(today.getTime() + 30 * 86400000);
    rangeEnd.setHours(23, 59, 59, 999);
    const rangeStart = from ? new Date(from) : today;
    rangeStart.setHours(0, 0, 0, 0);

    const items: ExpiryItem[] = [];

    if (entity !== "mooc") {
      const records = await this.prisma.vehicleRecord.findMany({
        select: { bienSo: true, hanDangKiem: true, hanCaVet: true },
      });

      for (const rec of records) {
        const plate = rec.bienSo ?? "";

        if (type !== "cavet" && rec.hanDangKiem) {
          const d = new Date(rec.hanDangKiem);
          if (d < today || (d >= rangeStart && d <= rangeEnd)) {
            items.push({
              entityType: "xe",
              plateOrMooc: plate,
              expType: "dangkiem",
              expDate: isoDate(d),
              daysLeft: Math.floor((d.getTime() - today.getTime()) / 86400000),
            });
          }
        }

        if (type !== "dangkiem" && rec.hanCaVet) {
          const d = new Date(rec.hanCaVet);
          if (d < today || (d >= rangeStart && d <= rangeEnd)) {
            items.push({
              entityType: "xe",
              plateOrMooc: plate,
              expType: "cavet",
              expDate: isoDate(d),
              daysLeft: Math.floor((d.getTime() - today.getTime()) / 86400000),
            });
          }
        }
      }
    }

    if (entity !== "xe") {
      const moocs = await this.prisma.vehicleRecordMooc.findMany({
        select: {
          soMooc: true,
          hanDangKiem: true,
          hanCaVet: true,
          vehicleRecord: { select: { bienSo: true } },
        },
      });

      for (const m of moocs) {
        const moocId = m.soMooc ?? "";
        const parentPlate = m.vehicleRecord?.bienSo ?? undefined;

        if (type !== "cavet" && m.hanDangKiem) {
          const d = new Date(m.hanDangKiem);
          if (d < today || (d >= rangeStart && d <= rangeEnd)) {
            items.push({
              entityType: "mooc",
              plateOrMooc: moocId,
              parentPlate,
              expType: "dangkiem",
              expDate: isoDate(d),
              daysLeft: Math.floor((d.getTime() - today.getTime()) / 86400000),
            });
          }
        }

        if (type !== "dangkiem" && m.hanCaVet) {
          const d = new Date(m.hanCaVet);
          if (d < today || (d >= rangeStart && d <= rangeEnd)) {
            items.push({
              entityType: "mooc",
              plateOrMooc: moocId,
              parentPlate,
              expType: "cavet",
              expDate: isoDate(d),
              daysLeft: Math.floor((d.getTime() - today.getTime()) / 86400000),
            });
          }
        }
      }
    }

    items.sort((a, b) => a.daysLeft - b.daysLeft);
    return items;
  }
}
