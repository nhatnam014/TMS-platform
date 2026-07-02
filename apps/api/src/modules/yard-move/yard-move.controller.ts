import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { PaginationQuery } from "@tms/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BulkDeleteDto } from "./dto/bulk-delete.dto";
import { CreateYardMoveDto } from "./dto/create-yard-move.dto";
import { UpdateYardMoveDto } from "./dto/update-yard-move.dto";
import { YardMoveService } from "./yard-move.service";

@ApiTags("Yard Moves")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("yard-moves")
export class YardMoveController {
  constructor(private readonly yardMoveService: YardMoveService) {}

  @Post()
  @ApiOperation({ summary: "Create a new yard move (lệnh bãi)" })
  create(@Body() dto: CreateYardMoveDto) {
    return this.yardMoveService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List yard moves with pagination and free-text search" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  findAll(@Query("search") search?: string, @Query() pagination?: PaginationQuery) {
    return this.yardMoveService.findAll({ search }, pagination ?? {});
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update yard move fields or soft-delete with { isActive: false }" })
  update(@Param("id") id: string, @Body() dto: UpdateYardMoveDto) {
    return this.yardMoveService.update(id, dto);
  }

  @Post("bulk-delete")
  @ApiOperation({ summary: "Permanently delete multiple yard moves by id" })
  bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.yardMoveService.bulkDelete(dto.ids);
  }
}
