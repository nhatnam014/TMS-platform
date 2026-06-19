import { Module } from "@nestjs/common";
import { VehicleMaintenanceController } from "./vehicle-maintenance.controller";
import { VehicleMaintenanceService } from "./vehicle-maintenance.service";

@Module({
  controllers: [VehicleMaintenanceController],
  providers: [VehicleMaintenanceService],
})
export class VehicleMaintenanceModule {}
