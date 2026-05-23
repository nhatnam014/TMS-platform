import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DriverService } from "./driver.service";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";

@ApiTags("Drivers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("drivers")
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get()
  @ApiOperation({ summary: "List all drivers with assigned vehicle" })
  findAll() {
    return this.driverService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Register a new driver" })
  create(@Body() dto: CreateDriverDto) {
    return this.driverService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update driver fields or assign/unassign vehicle" })
  update(@Param("id") id: string, @Body() dto: UpdateDriverDto) {
    return this.driverService.update(id, dto);
  }
}
