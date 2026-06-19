import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumberString, IsOptional, IsString } from "class-validator";

export class CreateVehicleMaintenanceDto {
  @ApiPropertyOptional({ example: "50E-12208" })
  @IsOptional()
  @IsString()
  bienSo?: string;

  @ApiPropertyOptional({ example: "LÂM UY LỰC" })
  @IsOptional()
  @IsString()
  tenTaiXe?: string;

  @ApiPropertyOptional({ example: "0844858979" })
  @IsOptional()
  @IsString()
  sdt?: string;

  @ApiPropertyOptional({ example: "CHENGLONG" })
  @IsOptional()
  @IsString()
  loaiXe?: string;

  @ApiPropertyOptional({ example: "CHENG LONG" })
  @IsOptional()
  @IsString()
  donViSuaChua?: string;

  @ApiPropertyOptional({ example: "2024-06-15" })
  @IsOptional()
  @IsDateString()
  ngayLam?: string;

  @ApiPropertyOptional({ example: "250000" })
  @IsOptional()
  @IsNumberString()
  soKmBaoDuong?: string;

  @ApiPropertyOptional({ example: "260000" })
  @IsOptional()
  @IsNumberString()
  kiBaoDuongTiepTheo?: string;

  @ApiPropertyOptional({ example: "255000" })
  @IsOptional()
  @IsNumberString()
  soKmHienTai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ghiChu?: string;
}
