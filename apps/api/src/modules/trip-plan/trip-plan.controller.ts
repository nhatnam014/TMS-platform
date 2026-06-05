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
import { ApiOperation, ApiQuery, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import type { PaginationQuery, TripPlanFilters } from "@tms/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AddTripPlanCostDto } from "./dto/add-trip-plan-cost.dto";
import { CreateTripPlanDto } from "./dto/create-trip-plan.dto";
import { TripPlanService } from "./trip-plan.service";

@ApiTags("Trip Plans")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("trip-plans")
export class TripPlanController {
  constructor(private readonly tripPlanService: TripPlanService) {}

  @Get()
  @ApiOperation({ summary: "List trip plans with filters & pagination" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  @ApiQuery({ name: "customerId", required: false })
  @ApiQuery({ name: "serviceType", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "search", required: false })
  findAll(@Query() filters: TripPlanFilters, @Query() pagination: PaginationQuery) {
    return this.tripPlanService.findAll(filters, pagination);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get trip plan detail by ID" })
  findOne(@Param("id") id: string): Promise<any> {
    return this.tripPlanService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new trip plan (dispatch)" })
  create(@Body() dto: CreateTripPlanDto) {
    return this.tripPlanService.create(dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update trip status (PLANNED → DISPATCHED → IN_TRANSIT → COMPLETED)" })
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.tripPlanService.updateStatus(id, status);
  }

  @Post(":id/costs")
  @ApiOperation({ summary: "Add a cost entry to a trip" })
  addCost(@Param("id") id: string, @Body() dto: AddTripPlanCostDto): Promise<any> {
    return this.tripPlanService.addCost(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a trip plan" })
  delete(@Param("id") id: string) {
    return this.tripPlanService.delete(id);
  }
}
