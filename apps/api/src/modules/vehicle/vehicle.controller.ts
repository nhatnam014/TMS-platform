import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VehicleService } from "./vehicle.service";

@ApiTags("Vehicles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("vehicles")
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  @ApiOperation({ summary: "List all vehicles with drivers and trailers" })
  findAll() {
    return this.vehicleService.findAll();
  }

  @Get("compliance-alerts")
  @ApiOperation({ summary: "Get vehicles/trailers expiring within N days" })
  @ApiQuery({ name: "days", required: false, description: "Days ahead to check (default 30)" })
  getAlerts(@Query("days") days?: number) {
    return this.vehicleService.getComplianceAlerts(days ?? 30);
  }
}
