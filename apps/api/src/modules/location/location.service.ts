import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.location.findMany({
      select: { id: true, code: true, name: true, locationType: true },
      orderBy: { name: "asc" },
    });
  }
}
