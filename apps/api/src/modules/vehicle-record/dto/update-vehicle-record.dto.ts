import { PartialType } from "@nestjs/swagger";
import { CreateVehicleRecordDto } from "./create-vehicle-record.dto";

export class UpdateVehicleRecordDto extends PartialType(CreateVehicleRecordDto) {}
