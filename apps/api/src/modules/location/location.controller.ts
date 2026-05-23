import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { LocationService } from "./location.service";

@ApiTags("Locations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("locations")
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ApiOperation({ summary: "List all active locations" })
  findAll() {
    return this.locationService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create a new location" })
  create(@Body() dto: CreateLocationDto) {
    return this.locationService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a location (or soft-deactivate with isActive: false)" })
  update(@Param("id") id: string, @Body() dto: UpdateLocationDto) {
    return this.locationService.update(id, dto);
  }
}
