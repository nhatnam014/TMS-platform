import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VehicleService } from "./vehicle.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

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

  @Post()
  @ApiOperation({ summary: "Create a new vehicle" })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update vehicle fields or status" })
  update(@Param("id") id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicleService.update(id, dto);
  }
}
