import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { PaginationQuery } from "@tms/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BulkDeleteDto } from "./dto/bulk-delete.dto";
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
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  findAll(
    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query() pagination?: PaginationQuery,
  ) {
    return this.locationService.findAll(search, type, pagination ?? {});
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

  @Post("bulk-delete")
  @ApiOperation({ summary: "Permanently delete multiple locations by id" })
  bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.locationService.bulkDelete(dto.ids);
  }
}
