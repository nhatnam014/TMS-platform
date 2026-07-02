import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsString } from "class-validator";
import type { BulkDeleteDto as IBulkDeleteDto } from "@tms/shared";

export class BulkDeleteDto implements IBulkDeleteDto {
  @ApiProperty({ type: [String], example: ["id1", "id2"] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
