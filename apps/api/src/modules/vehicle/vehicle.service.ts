import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicle.findMany({
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
        trailers: {
          where: { releasedAt: null },
          include: { trailer: true },
        },
      },
      orderBy: { licensePlate: "asc" },
    });
  }

  async getComplianceAlerts(daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const [vehicles, trailers] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { inspectionExpiry: { lte: cutoff } },
            { insuranceExpiry: { lte: cutoff } },
            { registrationExpiry: { lte: cutoff } },
          ],
        },
        include: { driver: true },
      }),
      this.prisma.trailer.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { inspectionExpiry: { lte: cutoff } },
            { insuranceExpiry: { lte: cutoff } },
            { registrationExpiry: { lte: cutoff } },
          ],
        },
      }),
    ]);

    return { vehicles, trailers };
  }
}
