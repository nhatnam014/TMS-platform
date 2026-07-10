import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ExportService } from "./export.service";

@ApiTags("Export")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get("trip-plans")
  @ApiOperation({ summary: "Export trip plans as Excel" })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  async exportTripPlans(
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportTripPlans(from, to);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ke-hoach-xe.xlsx"',
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }

  @Get("vehicles")
  @ApiOperation({ summary: "Export vehicle compliance data as Excel" })
  async exportVehicles(@Res() res: Response) {
    const buffer = await this.exportService.exportVehicles();
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="quan-ly-xe.xlsx"',
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }

  @Get("vehicle-maintenance")
  @ApiOperation({ summary: "Export vehicle maintenance records as multi-sheet Excel" })
  @ApiQuery({ name: "units", required: false, description: "Comma-separated loaiXe values" })
  async exportVehicleMaintenance(@Query("units") units: string | undefined, @Res() res: Response) {
    const unitList = units ? units.split(",").map((u) => u.trim()).filter(Boolean) : [];
    const buffer = await this.exportService.exportVehicleMaintenance(unitList);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="bao-duong-xe.xlsx"',
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }

  @Get("yard-moves")
  @ApiOperation({ summary: "Export yard moves (tiến độ vận tải) as Excel" })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  @ApiQuery({
    name: "daKeoStatus",
    required: false,
    enum: ["hauled", "pending"],
    description: "Filter by đã kéo status: hauled = daKeo non-empty, pending = daKeo null/empty",
  })
  async exportYardMoves(
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("daKeoStatus") daKeoStatus: "hauled" | "pending" | undefined,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportYardMoves(from, to, daKeoStatus);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="tien-do-van-tai.xlsx"',
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }
}
