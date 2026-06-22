import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VehicleMaintenanceService } from "./vehicle-maintenance.service";
import { UpdateMaintenanceFieldsDto } from "./dto/update-maintenance-fields.dto";
import { BatchKmRoundsDto } from "./dto/km-round.dto";

@ApiTags("VehicleMaintenance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("vehicle-maintenance")
export class VehicleMaintenanceController {
  constructor(private readonly vehicleMaintenanceService: VehicleMaintenanceService) {}

  @Get()
  @ApiOperation({ summary: "List vehicle records for bảo dưỡng view with search and pagination" })
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
  @ApiOperation({ summary: "Get distinct loaiXe values from vehicle records" })
  distinctUnits() {
    return this.vehicleMaintenanceService.distinctUnits();
  }

  @Get(":vehicleRecordId")
  @ApiOperation({ summary: "Get maintenance profile for a vehicle record" })
  findOne(@Param("vehicleRecordId") vehicleRecordId: string) {
    return this.vehicleMaintenanceService.findOne(vehicleRecordId);
  }

  @Patch(":vehicleRecordId")
  @ApiOperation({ summary: "Update donViSuaChua and ngayLam on a vehicle record" })
  updateMaintenanceFields(
    @Param("vehicleRecordId") vehicleRecordId: string,
    @Body() dto: UpdateMaintenanceFieldsDto,
  ) {
    return this.vehicleMaintenanceService.updateMaintenanceFields(vehicleRecordId, dto);
  }

  @Get(":vehicleRecordId/km-rounds")
  @ApiOperation({ summary: "List km rounds for a vehicle record" })
  listKmRounds(@Param("vehicleRecordId") vehicleRecordId: string) {
    return this.vehicleMaintenanceService.listKmRounds(vehicleRecordId);
  }

  @Put(":vehicleRecordId/km-rounds")
  @ApiOperation({ summary: "Batch upsert km rounds for a vehicle record" })
  batchUpsertKmRounds(
    @Param("vehicleRecordId") vehicleRecordId: string,
    @Body() dto: BatchKmRoundsDto,
  ) {
    return this.vehicleMaintenanceService.batchUpsertKmRounds(vehicleRecordId, dto.rounds);
  }

  @Delete(":vehicleRecordId/km-rounds/:roundNumber")
  @ApiOperation({ summary: "Delete a specific km round" })
  deleteKmRound(
    @Param("vehicleRecordId") vehicleRecordId: string,
    @Param("roundNumber", ParseIntPipe) roundNumber: number,
  ) {
    return this.vehicleMaintenanceService.deleteKmRound(vehicleRecordId, roundNumber);
  }
}
