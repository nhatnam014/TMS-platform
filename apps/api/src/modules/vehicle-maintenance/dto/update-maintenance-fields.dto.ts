import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

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

  @ApiPropertyOptional({ example: "Cần kiểm tra phanh" })
  @IsOptional()
  @IsString()
  ghiChuBaoDuong?: string | null;
}
