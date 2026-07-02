import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { PaginationQuery } from "@tms/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BulkDeleteDto } from "./dto/bulk-delete.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomerService } from "./customer.service";

@ApiTags("Customers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("customers")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: "List all active customers" })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  findAll(@Query("search") search?: string, @Query() pagination?: PaginationQuery) {
    return this.customerService.findAll(search, pagination ?? {});
  }

  @Post()
  @ApiOperation({ summary: "Create a new customer" })
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a customer (or soft-deactivate with isActive: false)" })
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @Post("bulk-delete")
  @ApiOperation({ summary: "Permanently delete multiple customers by id (skips those referenced by trip plans)" })
  bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.customerService.bulkDelete(dto.ids);
  }
}
