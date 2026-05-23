import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateCarrierDto } from "./dto/create-carrier.dto";
import { UpdateCarrierDto } from "./dto/update-carrier.dto";
import { CarrierService } from "./carrier.service";

@ApiTags("Carriers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("carriers")
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Get()
  @ApiOperation({ summary: "List all active carriers" })
  findAll() {
    return this.carrierService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create a new carrier" })
  create(@Body() dto: CreateCarrierDto) {
    return this.carrierService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a carrier (or soft-deactivate with isActive: false)" })
  update(@Param("id") id: string, @Body() dto: UpdateCarrierDto) {
    return this.carrierService.update(id, dto);
  }
}
