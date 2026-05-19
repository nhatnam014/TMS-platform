import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { YardMoveStatus } from "@tms/db";

export class UpdateYardMoveStatusDto {
  @ApiProperty({ enum: YardMoveStatus })
  @IsEnum(YardMoveStatus)
  status!: YardMoveStatus;
}
