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
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateCostTemplateDto } from "./dto/create-cost-template.dto";
import { UpdateCostTemplateDto } from "./dto/update-cost-template.dto";
import { CostTemplatesService } from "./cost-templates.service";

@ApiTags("Cost Templates")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("cost-templates")
export class CostTemplatesController {
  constructor(private readonly costTemplatesService: CostTemplatesService) {}

  @Get()
  @ApiOperation({ summary: "List cost templates, optionally filtered by ?q= search" })
  @ApiQuery({ name: "q", required: false })
  findAll(@Query("q") q?: string) {
    return this.costTemplatesService.findAll(q);
  }

  @Post()
  @ApiOperation({ summary: "Create a new cost template" })
  create(@Body() dto: CreateCostTemplateDto) {
    return this.costTemplatesService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a cost template" })
  update(@Param("id") id: string, @Body() dto: UpdateCostTemplateDto) {
    return this.costTemplatesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a cost template" })
  remove(@Param("id") id: string) {
    return this.costTemplatesService.remove(id);
  }
}
