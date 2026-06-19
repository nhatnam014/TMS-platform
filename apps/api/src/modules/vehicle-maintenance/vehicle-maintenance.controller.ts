import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VehicleMaintenanceService } from "./vehicle-maintenance.service";
import { CreateVehicleMaintenanceDto } from "./dto/create-vehicle-maintenance.dto";
import { UpdateVehicleMaintenanceDto } from "./dto/update-vehicle-maintenance.dto";

@ApiTags("VehicleMaintenance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("vehicle-maintenance")
export class VehicleMaintenanceController {
  constructor(private readonly vehicleMaintenanceService: VehicleMaintenanceService) {}

  @Get()
  @ApiOperation({ summary: "List vehicle maintenance records with search and pagination" })
  findAll(
    @Query("search") search?: string,
    @Query("loaiXe") loaiXe?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.vehicleMaintenanceService.findAll(
      { search, loaiXe },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined },
    );
  }

  @Get("distinct-units")
  @ApiOperation({ summary: "Get distinct loaiXe values for export unit selector" })
  distinctUnits() {
    return this.vehicleMaintenanceService.distinctUnits();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single vehicle maintenance record" })
  findOne(@Param("id") id: string) {
    return this.vehicleMaintenanceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a vehicle maintenance record" })
  create(@Body() dto: CreateVehicleMaintenanceDto) {
    return this.vehicleMaintenanceService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a vehicle maintenance record" })
  update(@Param("id") id: string, @Body() dto: UpdateVehicleMaintenanceDto) {
    return this.vehicleMaintenanceService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a vehicle maintenance record" })
  remove(@Param("id") id: string) {
    return this.vehicleMaintenanceService.remove(id);
  }
}
