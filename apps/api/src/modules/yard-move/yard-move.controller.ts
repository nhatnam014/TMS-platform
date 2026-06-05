import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { YardMoveStatus } from "@tms/db";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateYardMoveCostDto } from "./dto/create-yard-move-cost.dto";
import { CreateYardMoveDto } from "./dto/create-yard-move.dto";
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
  findAll(@Query("locationId") locationId?: string, @Query("status") status?: YardMoveStatus) {
    return this.yardMoveService.findAll({ locationId, status });
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
