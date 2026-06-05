import { Module } from "@nestjs/common";
import { TripCostController } from "./trip-cost.controller";
import { TripCostService } from "./trip-cost.service";

@Module({
  controllers: [TripCostController],
  providers: [TripCostService],
  exports: [TripCostService],
})
export class TripCostModule {}
