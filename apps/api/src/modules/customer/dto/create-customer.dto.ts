import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import type { CreateCustomerDto as ICreateCustomerDto } from "@tms/shared";

export class CreateCustomerDto implements ICreateCustomerDto {
  @ApiProperty({ example: "SAILUN_TAL" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: "SAILUN TAL" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxCode?: string;
}
