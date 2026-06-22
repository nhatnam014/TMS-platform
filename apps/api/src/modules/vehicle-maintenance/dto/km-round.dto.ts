import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsString, Min, ValidateNested } from "class-validator";

export class KmRoundDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  roundNumber!: number;

  @ApiProperty({ example: "250.000 km" })
  @IsString()
  kmCon!: string;
}

export class BatchKmRoundsDto {
  @ApiProperty({ type: [KmRoundDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KmRoundDto)
  rounds!: KmRoundDto[];
}
