import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import type { CreateContainerSizeDto as ICreateContainerSizeDto } from "@tms/shared";

export class CreateContainerSizeDto implements ICreateContainerSizeDto {
  @ApiProperty({ example: "40HC" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: "40ft High Cube" })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
