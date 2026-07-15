import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import type {
  CreateVehicleRecordDto as ICreateVehicleRecordDto,
  VehicleRecordMoocDto,
  NoteItemDto,
} from "@tms/shared";

class NoteDto implements NoteItemDto {
  @ApiProperty({ example: "Cần thay lốp" })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

class MoocDto implements VehicleRecordMoocDto {
  @ApiProperty({ example: "50RM01660" })
  @IsString()
  soMooc!: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  hanDangKiem?: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  hanBaoHiem?: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  hanCaVet?: string;
}

export class CreateVehicleRecordDto implements ICreateVehicleRecordDto {
  @ApiPropertyOptional({ example: "LÂM UY LỰC" })
  @IsOptional()
  @IsString()
  tenTaiXe?: string;

  @ApiPropertyOptional({ example: "0844858979" })
  @IsOptional()
  @IsString()
  sdt?: string;

  @ApiPropertyOptional({ example: "SHACMAN" })
  @IsOptional()
  @IsString()
  loaiXe?: string;

  @ApiPropertyOptional({ example: "50E12208" })
  @IsOptional()
  @IsString()
  bienSo?: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  hanDangKiem?: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  hanBaoHiem?: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  hanCaVet?: string;

  @ApiPropertyOptional({ example: "Gara ABC" })
  @IsOptional()
  @IsString()
  donViSuaChua?: string;

  @ApiPropertyOptional({ example: "2026-05-11" })
  @IsOptional()
  @IsDateString()
  ngayLam?: string;

  @ApiPropertyOptional({ example: "320.000 km" })
  @IsOptional()
  @IsString()
  kmHienTai?: string;

  @ApiPropertyOptional({ type: [NoteDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteDto)
  notes?: NoteDto[];

  @ApiPropertyOptional({ type: [MoocDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoocDto)
  moocs?: MoocDto[];
}
