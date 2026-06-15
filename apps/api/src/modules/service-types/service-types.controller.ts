import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateServiceTypeDto } from "./dto/create-service-type.dto";
import { UpdateServiceTypeDto } from "./dto/update-service-type.dto";
import { ServiceTypesService } from "./service-types.service";

@ApiTags("Service Types")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("service-types")
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Get()
  @ApiOperation({ summary: "List all service types" })
  findAll() {
    return this.serviceTypesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create a new service type" })
  create(@Body() dto: CreateServiceTypeDto) {
    return this.serviceTypesService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a service type" })
  update(@Param("id") id: string, @Body() dto: UpdateServiceTypeDto) {
    return this.serviceTypesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a service type (409 if referenced by trip plans)" })
  remove(@Param("id") id: string) {
    return this.serviceTypesService.remove(id);
  }
}
