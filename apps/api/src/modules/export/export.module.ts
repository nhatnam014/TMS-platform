import { Module } from "@nestjs/common";
import { TripPlanModule } from "../trip-plan/trip-plan.module";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";

@Module({
  imports: [TripPlanModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
