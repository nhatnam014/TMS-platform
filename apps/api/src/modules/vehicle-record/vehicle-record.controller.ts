import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VehicleRecordService } from "./vehicle-record.service";
import { CreateVehicleRecordDto } from "./dto/create-vehicle-record.dto";
import { UpdateVehicleRecordDto } from "./dto/update-vehicle-record.dto";

@ApiTags("VehicleRecords")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("vehicle-records")
export class VehicleRecordController {
  constructor(private readonly vehicleRecordService: VehicleRecordService) {}

  @Get()
  @ApiOperation({ summary: "List all vehicle records with moocs" })
  findAll() {
    return this.vehicleRecordService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create a new vehicle record" })
  create(@Body() dto: CreateVehicleRecordDto) {
    return this.vehicleRecordService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a vehicle record and replace its moocs" })
  update(@Param("id") id: string, @Body() dto: UpdateVehicleRecordDto) {
    return this.vehicleRecordService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a vehicle record and all its moocs" })
  delete(@Param("id") id: string) {
    return this.vehicleRecordService.delete(id);
  }
}
