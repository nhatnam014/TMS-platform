import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsOptional, IsString, ValidateNested } from "class-validator";
import type {
  CreateVehicleRecordDto as ICreateVehicleRecordDto,
  VehicleRecordMoocDto,
} from "@tms/shared";

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ghiChu?: string;

  @ApiPropertyOptional({ example: "Gara ABC" })
  @IsOptional()
  @IsString()
  donViSuaChua?: string;

  @ApiPropertyOptional({ example: "2026-05-11" })
  @IsOptional()
  @IsDateString()
  ngayLam?: string;

  @ApiPropertyOptional({ type: [MoocDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoocDto)
  moocs?: MoocDto[];
}
