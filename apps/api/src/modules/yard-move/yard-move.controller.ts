import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { YardMoveStatus } from "@tms/db";
import type { PaginationQuery } from "@tms/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateYardMoveCostDto } from "./dto/create-yard-move-cost.dto";
import { CreateYardMoveDto } from "./dto/create-yard-move.dto";
import { UpdateYardMoveDto } from "./dto/update-yard-move.dto";
import { UpdateYardMoveStatusDto } from "./dto/update-yard-move-status.dto";
import { YardMoveService } from "./yard-move.service";

@ApiTags("Yard Moves")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("yard-moves")
export class YardMoveController {
  constructor(private readonly yardMoveService: YardMoveService) {}

  @Post()
  @ApiOperation({ summary: "Create a new yard move (dọn bãi)" })
  create(@Body() dto: CreateYardMoveDto) {
    return this.yardMoveService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List yard moves with optional filters" })
  @ApiQuery({ name: "locationId", required: false })
  @ApiQuery({ name: "status", required: false, enum: YardMoveStatus })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  findAll(
    @Query("locationId") locationId?: string,
    @Query("status") status?: YardMoveStatus,
    @Query("search") search?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query() pagination?: PaginationQuery,
  ) {
    return this.yardMoveService.findAll(
      { locationId, status, search, dateFrom, dateTo },
      pagination ?? {},
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update yard move fields or soft-delete with { isActive: false }" })
  update(@Param("id") id: string, @Body() dto: UpdateYardMoveDto) {
    return this.yardMoveService.update(id, dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update yard move status (PENDING → IN_PROGRESS → COMPLETED)" })
  updateStatus(@Param("id") id: string, @Body() dto: UpdateYardMoveStatusDto) {
    return this.yardMoveService.updateStatus(id, dto.status);
  }

  @Post(":id/costs")
  @ApiOperation({ summary: "Add an internal cost entry to a yard move" })
  addCost(@Param("id") id: string, @Body() dto: CreateYardMoveCostDto) {
    return this.yardMoveService.addCost(id, dto);
  }
}
