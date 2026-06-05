import { Module } from "@nestjs/common";
import { VehicleRecordController } from "./vehicle-record.controller";
import { VehicleRecordService } from "./vehicle-record.service";

@Module({
  controllers: [VehicleRecordController],
  providers: [VehicleRecordService],
})
export class VehicleRecordModule {}
