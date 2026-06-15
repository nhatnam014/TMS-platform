import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import type { CreateServiceTypeDto as ICreateServiceTypeDto } from "@tms/shared";

export class CreateServiceTypeDto implements ICreateServiceTypeDto {
  @ApiProperty({ example: "SEA-EX" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: "SEA - EXPORT" })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
