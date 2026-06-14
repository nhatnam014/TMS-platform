import { PartialType } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import type { UpdateTripPlanDto as IUpdateTripPlanDto } from "@tms/shared";
import { CreateTripPlanDto } from "./create-trip-plan.dto";

const TRIP_STATUSES = ["PLANNED", "DISPATCHED", "IN_TRANSIT", "COMPLETED", "CANCELLED"] as const;

export class UpdateTripPlanDto
  extends PartialType(CreateTripPlanDto)
  implements IUpdateTripPlanDto
{
  @ApiPropertyOptional({ enum: TRIP_STATUSES })
  @IsOptional()
  @IsEnum(TRIP_STATUSES)
  status?: (typeof TRIP_STATUSES)[number];
}
