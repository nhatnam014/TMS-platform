import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { PaginationQuery } from "@tms/shared";
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
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "isActive", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  findAll(
    @Query("search") search?: string,
    @Query("isActive") isActiveStr?: string,
    @Query() pagination?: PaginationQuery,
  ) {
    const isActive = isActiveStr === "true" ? true : isActiveStr === "false" ? false : undefined;
    return this.serviceTypesService.findAll(search, isActive, pagination ?? {});
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
