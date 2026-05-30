import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { UserRole } from "@tms/shared";
import type { UpdateUserDto as IUpdateUserDto } from "@tms/shared";

export class UpdateUserDto implements IUpdateUserDto {
  @ApiPropertyOptional({ enum: ["ADMIN", "OPERATOR", "VIEWER"] })
  @IsOptional()
  @IsEnum(["ADMIN", "OPERATOR", "VIEWER"])
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
