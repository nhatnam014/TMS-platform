import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get dashboard statistics with optional trip date range" })
  getStats(@Query("tripFrom") tripFrom?: string, @Query("tripTo") tripTo?: string) {
    return this.dashboardService.getStats(tripFrom, tripTo);
  }

  @Get("trips-trend")
  @ApiOperation({ summary: "Get daily trip counts for a date range" })
  getTripsTrend(@Query("from") from: string, @Query("to") to: string) {
    return this.dashboardService.getTripsTrend(from, to);
  }

  @Get("expiry-list")
  @ApiOperation({ summary: "Get expiry events for vehicles and moocs" })
  getExpiryList(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("entity") entity?: "all" | "xe" | "mooc",
    @Query("type") type?: "all" | "dangkiem" | "cavet",
  ) {
    return this.dashboardService.getExpiryList(from, to, entity, type);
  }
}
