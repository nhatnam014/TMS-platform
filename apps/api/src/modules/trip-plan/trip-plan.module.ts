import { Module } from "@nestjs/common";
import { TripPlanController } from "./trip-plan.controller";
import { TripPlanService } from "./trip-plan.service";

@Module({
  controllers: [TripPlanController],
  providers: [TripPlanService],
  exports: [TripPlanService],
})
export class TripPlanModule {}
