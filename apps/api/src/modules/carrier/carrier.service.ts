import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class CarrierService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.carrier.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}
