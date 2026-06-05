import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { UserRole } from "@tms/shared";
import type { CreateUserDto as ICreateUserDto } from "@tms/shared";

export class CreateUserDto implements ICreateUserDto {
  @ApiProperty({ example: "operator01" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: "secret123", minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: ["ADMIN", "OPERATOR", "VIEWER"] })
  @IsEnum(["ADMIN", "OPERATOR", "VIEWER"])
  role!: UserRole;
}
