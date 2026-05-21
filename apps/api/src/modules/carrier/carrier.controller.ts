import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CarrierService } from "./carrier.service";

@ApiTags("Carriers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("carriers")
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Get()
  @ApiOperation({ summary: "List all carriers" })
  findAll() {
    return this.carrierService.findAll();
  }
}
