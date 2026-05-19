import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ContainerStatus } from "@tms/db";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ContainerService } from "./container.service";

@ApiTags("Containers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("containers")
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Get()
  @ApiOperation({ summary: "List containers with optional status and locationId filters" })
  @ApiQuery({ name: "status", required: false, enum: ContainerStatus })
  @ApiQuery({ name: "locationId", required: false })
  findAll(
    @Query("status") status?: ContainerStatus,
    @Query("locationId") locationId?: string,
  ) {
    return this.containerService.findAll({ status, locationId });
  }
}
