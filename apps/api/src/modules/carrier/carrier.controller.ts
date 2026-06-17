import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { PaginationQuery } from "@tms/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateCarrierDto } from "./dto/create-carrier.dto";
import { UpdateCarrierDto } from "./dto/update-carrier.dto";
import { CarrierService } from "./carrier.service";

@ApiTags("Carriers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("carriers")
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Get()
  @ApiOperation({ summary: "List all active carriers" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  findAll(@Query("search") search?: string, @Query() pagination?: PaginationQuery) {
    return this.carrierService.findAll(search, pagination ?? {});
  }

  @Post()
  @ApiOperation({ summary: "Create a new carrier" })
  create(@Body() dto: CreateCarrierDto) {
    return this.carrierService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a carrier (or soft-deactivate with isActive: false)" })
  update(@Param("id") id: string, @Body() dto: UpdateCarrierDto) {
    return this.carrierService.update(id, dto);
  }
}
