import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import type { NoteItemDto } from "@tms/shared";

class NoteDto implements NoteItemDto {
  @ApiProperty({ example: "Cần kiểm tra phanh" })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateMaintenanceFieldsDto {
  @ApiPropertyOptional({ example: "Gara ABC" })
  @IsOptional()
  @IsString()
  donViSuaChua?: string | null;

  @ApiPropertyOptional({ example: "2026-05-11" })
  @IsOptional()
  @IsDateString()
  ngayLam?: string | null;

  @ApiPropertyOptional({ example: "320.000 km" })
  @IsOptional()
  @IsString()
  kmHienTai?: string | null;

  @ApiPropertyOptional({ type: [NoteDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteDto)
  notes?: NoteDto[];
}
