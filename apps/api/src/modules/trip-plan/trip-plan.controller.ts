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
import { BulkDeleteDto } from "./dto/bulk-delete.dto";
import { CreateTripPlanDto } from "./dto/create-trip-plan.dto";
import { UpdateTripPlanDto } from "./dto/update-trip-plan.dto";
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
  @ApiQuery({ name: "serviceTypeCode", required: false })
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

  @Patch(":id")
  @ApiOperation({ summary: "Update a trip plan (all fields + optional status)" })
  update(@Param("id") id: string, @Body() dto: UpdateTripPlanDto) {
    return this.tripPlanService.update(id, dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update trip status (PLANNED → DISPATCHED → IN_TRANSIT → COMPLETED)" })
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.tripPlanService.updateStatus(id, status);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a trip plan" })
  delete(@Param("id") id: string) {
    return this.tripPlanService.delete(id);
  }

  @Post("bulk-delete")
  @ApiOperation({ summary: "Delete multiple trip plans by id" })
  bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.tripPlanService.bulkDelete(dto.ids);
  }
}
