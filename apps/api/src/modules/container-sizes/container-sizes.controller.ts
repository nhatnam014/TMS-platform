import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateContainerSizeDto } from "./dto/create-container-size.dto";
import { UpdateContainerSizeDto } from "./dto/update-container-size.dto";
import { ContainerSizesService } from "./container-sizes.service";

@ApiTags("Container Sizes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("container-sizes")
export class ContainerSizesController {
  constructor(private readonly containerSizesService: ContainerSizesService) {}

  @Get()
  @ApiOperation({ summary: "List all container sizes" })
  findAll() {
    return this.containerSizesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create a new container size" })
  create(@Body() dto: CreateContainerSizeDto) {
    return this.containerSizesService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a container size" })
  update(@Param("id") id: string, @Body() dto: UpdateContainerSizeDto) {
    return this.containerSizesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a container size (409 if referenced by trip plans)" })
  remove(@Param("id") id: string) {
    return this.containerSizesService.remove(id);
  }
}
