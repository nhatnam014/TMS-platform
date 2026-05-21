import { Module } from "@nestjs/common";
import { CarrierController } from "./carrier.controller";
import { CarrierService } from "./carrier.service";

@Module({
  controllers: [CarrierController],
  providers: [CarrierService],
})
export class CarrierModule {}
