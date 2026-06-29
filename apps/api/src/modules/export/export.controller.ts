import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../audit/roles.guard";
import { ExportService } from "./export.service";

@ApiTags("Export")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get("trip-plans")
  @ApiOperation({ summary: "Export trip plans as Excel (ADMIN only)" })
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
  @ApiOperation({ summary: "Export vehicle compliance data as Excel (ADMIN only)" })
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
  @ApiOperation({ summary: "Export vehicle maintenance records as multi-sheet Excel (ADMIN only)" })
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
  @ApiOperation({ summary: "Export yard moves (lệnh bãi) as Excel (ADMIN only)" })
  async exportYardMoves(@Res() res: Response) {
    const buffer = await this.exportService.exportYardMoves();
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="lenh-bai.xlsx"',
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }
}
