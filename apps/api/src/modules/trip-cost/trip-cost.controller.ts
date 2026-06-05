import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../audit/roles.guard";
import { CreateTripCostDto } from "./dto/create-trip-cost.dto";
import { UpdateTripCostDto } from "./dto/update-trip-cost.dto";
import { TripCostService } from "./trip-cost.service";

@ApiTags("Trip Costs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("trip-costs")
export class TripCostController {
  constructor(private readonly tripCostService: TripCostService) {}

  @Get()
  @ApiOperation({ summary: "List all trip cost catalog items" })
  findAll() {
    return this.tripCostService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Create a trip cost catalog item (ADMIN)" })
  create(@Body() dto: CreateTripCostDto) {
    return this.tripCostService.create(dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Update a trip cost catalog item (ADMIN)" })
  update(@Param("id") id: string, @Body() dto: UpdateTripCostDto) {
    return this.tripCostService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: "Hard-delete a trip cost catalog item — cascades TripPlanCost rows (ADMIN)",
  })
  hardDelete(@Param("id") id: string) {
    return this.tripCostService.hardDelete(id);
  }
}
