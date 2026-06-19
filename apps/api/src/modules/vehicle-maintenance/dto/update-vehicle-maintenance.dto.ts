import { PartialType } from "@nestjs/swagger";
import { CreateVehicleMaintenanceDto } from "./create-vehicle-maintenance.dto";

export class UpdateVehicleMaintenanceDto extends PartialType(CreateVehicleMaintenanceDto) {}
