import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../../config/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { ImportResult } from "@tms/shared";
import { parseQuanLyXe } from "./parsers/quanly-xe.parser";
import { parseKeHoachXe } from "./parsers/kehoach-xe.parser";

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async importVehicles(buffer: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const rows = parseQuanLyXe(workbook);
    const warnings: string[] = [];
    const errors: string[] = [];
    let imported = 0;

    let currentVehicleId: string | null = null;

    for (const row of rows) {
      try {
        if (row.type === "skip") {
          if (row.reason) errors.push(row.reason);
          continue;
        }

        if (row.type === "vehicle" || row.type === "vehicle_driver") {
          if (!row.licensePlate) {
            errors.push(`Hàng ${row.rowNum}: thiếu số xe, bỏ qua`);
            continue;
          }

          const existingVehicle = await this.prisma.vehicle.findUnique({
            where: { licensePlate: row.licensePlate },
          });

          const vehicle = await this.prisma.vehicle.upsert({
            where: { licensePlate: row.licensePlate },
            update: {
              ...(row.inspectionExpiry !== undefined && { inspectionExpiry: row.inspectionExpiry }),
              ...(row.insuranceExpiry !== undefined && { insuranceExpiry: row.insuranceExpiry }),
              ...(row.vehicleType && { vehicleType: row.vehicleType }),
            },
            create: {
              licensePlate: row.licensePlate,
              vehicleType: row.vehicleType ?? "OTHER",
              inspectionExpiry: row.inspectionExpiry,
              insuranceExpiry: row.insuranceExpiry,
            },
          });

          if (!existingVehicle) {
            warnings.push(`Xe mới: ${row.licensePlate}`);
          }

          currentVehicleId = vehicle.id;
          imported++;

          if (row.type === "vehicle_driver" && row.driverName) {
            const existingDriver = await this.prisma.driver.findUnique({
              where: { vehicleId: vehicle.id },
            });
            await this.prisma.driver.upsert({
              where: { vehicleId: vehicle.id },
              update: { fullName: row.driverName, ...(row.driverPhone && { phone: row.driverPhone }) },
              create: {
                fullName: row.driverName,
                phone: row.driverPhone ?? null,
                vehicleId: vehicle.id,
              },
            });
            if (!existingDriver) {
              warnings.push(`Tài xế mới: ${row.driverName} (xe ${row.licensePlate})`);
            }
          }

          if (row.trailerNumber) {
            await this.upsertTrailerAndLink(row.trailerNumber, vehicle.id, row.trailerInspectionExpiry, row.trailerInsuranceExpiry, warnings);
          }
        } else if (row.type === "trailer_orphan") {
          if (!row.trailerNumber) continue;
          const existingTrailer = await this.prisma.trailer.findUnique({ where: { trailerNumber: row.trailerNumber } });
          await this.prisma.trailer.upsert({
            where: { trailerNumber: row.trailerNumber },
            update: {},
            create: {
              trailerNumber: row.trailerNumber,
              inspectionExpiry: row.trailerInspectionExpiry,
              insuranceExpiry: row.trailerInsuranceExpiry,
            },
          });
          if (!existingTrailer) warnings.push(`Rơ moóc mới (không có xe): ${row.trailerNumber}`);
        } else if (row.type === "trailer_continuation") {
          if (!row.trailerNumber) continue;
          await this.upsertTrailerAndLink(row.trailerNumber, currentVehicleId, row.trailerInspectionExpiry, row.trailerInsuranceExpiry, warnings);
        }
      } catch (err) {
        errors.push(`Hàng ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await this.auditService.log({
      action: "CREATE",
      entityType: "Vehicle",
      summary: `Excel import: ${imported} xe/tài xế/rơ moóc, ${warnings.length} cảnh báo, ${errors.length} lỗi`,
    });

    return { imported, warnings, errors };
  }

  private async upsertTrailerAndLink(
    trailerNumber: string,
    vehicleId: string | null,
    inspectionExpiry: Date | null | undefined,
    insuranceExpiry: Date | null | undefined,
    warnings: string[],
  ) {
    const existingTrailer = await this.prisma.trailer.findUnique({ where: { trailerNumber } });
    const trailer = await this.prisma.trailer.upsert({
      where: { trailerNumber },
      update: {},
      create: {
        trailerNumber,
        inspectionExpiry: inspectionExpiry ?? null,
        insuranceExpiry: insuranceExpiry ?? null,
      },
    });
    if (!existingTrailer) warnings.push(`Rơ moóc mới: ${trailerNumber}`);

    if (vehicleId) {
      const link = await this.prisma.vehicleTrailer.findFirst({
        where: { vehicleId, trailerId: trailer.id },
      });
      if (!link) {
        await this.prisma.vehicleTrailer.create({ data: { vehicleId, trailerId: trailer.id } });
      }
    }
  }

  async importTripPlans(buffer: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const rows = parseKeHoachXe(workbook);
    const warnings: string[] = [];
    const errors: string[] = [];
    let imported = 0;

    for (const row of rows) {
      try {
        if (row.type === "skip") {
          if (row.reason) errors.push(row.reason);
          continue;
        }

        if (!row.vehiclePlate) {
          errors.push(`Hàng ${row.rowNum}: thiếu số xe, bỏ qua`);
          continue;
        }
        if (!row.tripDate) {
          errors.push(`Hàng ${row.rowNum}: thiếu ngày, bỏ qua`);
          continue;
        }

        const vehicle = await this.findOrCreateVehicle(row.vehiclePlate, warnings);
        const customer = await this.findOrCreateCustomer(row.customerName, warnings);

        let carrierId: string | undefined;
        if (row.carrierName) {
          const carrier = await this.findOrCreateCarrier(row.carrierName, warnings);
          carrierId = carrier.id;
        }

        let outboundContainerId: string | undefined;
        if (row.outboundContainerNumber && row.outboundContainerSize) {
          const c = await this.findOrCreateContainer(row.outboundContainerNumber, row.outboundContainerSize);
          outboundContainerId = c.id;
        }

        let inboundContainerId: string | undefined;
        if (row.inboundContainerNumber && row.inboundContainerSize) {
          const c = await this.findOrCreateContainer(row.inboundContainerNumber, row.inboundContainerSize);
          inboundContainerId = c.id;
        }

        let pickupLocationId: string | undefined;
        if (row.pickupLocation) {
          const loc = await this.findOrCreateLocation(row.pickupLocation, warnings);
          pickupLocationId = loc.id;
        }

        let loadUnloadLocationId: string | undefined;
        if (row.loadUnloadLocation) {
          const loc = await this.findOrCreateLocation(row.loadUnloadLocation, warnings);
          loadUnloadLocationId = loc.id;
        }

        let dropoffLocationId: string | undefined;
        if (row.dropoffLocation) {
          const loc = await this.findOrCreateLocation(row.dropoffLocation, warnings);
          dropoffLocationId = loc.id;
        }

        const tripPlan = await this.prisma.tripPlan.create({
          data: {
            tripDate: row.tripDate,
            tripNumber: row.tripNumber ?? null,
            serviceType: row.serviceType ?? "SEA_EXPORT",
            vehicleId: vehicle.id,
            customerId: customer.id,
            carrierId: carrierId ?? null,
            outboundContainerId: outboundContainerId ?? null,
            inboundContainerId: inboundContainerId ?? null,
            pickupLocationId: pickupLocationId ?? null,
            loadUnloadLocationId: loadUnloadLocationId ?? null,
            dropoffLocationId: dropoffLocationId ?? null,
            notes: row.notes ?? null,
          },
        });

        if (row.totalCost && row.totalCost > 0) {
          await this.prisma.tripCost.create({
            data: {
              tripPlanId: tripPlan.id,
              costType: "OTHER",
              amount: row.totalCost,
              description: "Tổng cước (nhập từ Excel)",
            },
          });
        }

        imported++;
      } catch (err) {
        errors.push(`Hàng ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await this.auditService.log({
      action: "CREATE",
      entityType: "TripPlan",
      summary: `Excel import: ${imported} chuyến xe, ${warnings.length} cảnh báo, ${errors.length} lỗi`,
    });

    return { imported, warnings, errors };
  }

  private async findOrCreateVehicle(licensePlate: string, warnings: string[]) {
    const existing = await this.prisma.vehicle.findUnique({ where: { licensePlate } });
    if (existing) return existing;
    warnings.push(`Xe mới tự tạo: ${licensePlate}`);
    return this.prisma.vehicle.create({ data: { licensePlate, vehicleType: "OTHER" } });
  }

  private async findOrCreateCustomer(name: string | undefined, warnings: string[]) {
    if (!name) {
      return this.prisma.customer.findFirst({ where: { code: "UNKNOWN" } }).then((c) =>
        c ?? this.prisma.customer.create({ data: { code: "UNKNOWN", name: "Không xác định" } })
      );
    }
    const existing = await this.prisma.customer.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;
    warnings.push(`Khách hàng mới tự tạo: ${name}`);
    const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 50);
    return this.prisma.customer.create({ data: { code: `${code}_${Date.now()}`, name } });
  }

  private async findOrCreateCarrier(name: string, warnings: string[]) {
    const existing = await this.prisma.carrier.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;
    warnings.push(`Hãng xe mới tự tạo: ${name}`);
    const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 50);
    return this.prisma.carrier.create({ data: { code: `${code}_${Date.now()}`, name } });
  }

  private async findOrCreateContainer(containerNumber: string, sizeType: string) {
    return this.prisma.container.upsert({
      where: { containerNumber },
      update: {},
      create: { containerNumber, sizeType: sizeType as any },
    });
  }

  private async findOrCreateLocation(name: string, warnings: string[]) {
    const existing = await this.prisma.location.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;
    warnings.push(`Địa điểm mới tự tạo: ${name}`);
    const code = name.toUpperCase().replace(/\s+/g, "_").slice(0, 50);
    return this.prisma.location.create({
      data: { code: `${code}_${Date.now()}`, name, locationType: "OTHER" },
    });
  }
}
