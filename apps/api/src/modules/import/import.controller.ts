import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../audit/roles.guard";
import { ImportService } from "./import.service";

@ApiTags("Import")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("import")
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post("vehicles")
  @ApiOperation({
    summary:
      "Import vehicle records from quản lý xe sheet (ADMIN only). Without ?confirm=true returns a preview with conflict analysis.",
  })
  @ApiQuery({
    name: "confirm",
    required: false,
    type: Boolean,
    description: "Set to true to execute the import; omit for preview only",
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  importVehicles(@UploadedFile() file: Express.Multer.File, @Query("confirm") confirm?: string) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.importService.importVehicles(file.buffer, confirm === "true");
  }

  @Post("trip-plans")
  @ApiOperation({ summary: "Import trip plans from kế hoạch xe sheet (ADMIN only)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  importTripPlans(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.importService.importTripPlans(file.buffer);
  }

  @Post("vehicle-maintenance")
  @ApiOperation({ summary: "Import vehicle maintenance records from multi-sheet Excel (ADMIN only)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  importVehicleMaintenance(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.importService.importVehicleMaintenance(file.buffer);
  }

  @Post("yard-moves")
  @ApiOperation({
    summary:
      "Import yard moves from lệnh bãi sheet (ADMIN only). Without ?confirm=true returns a preview with create/update counts.",
  })
  @ApiQuery({
    name: "confirm",
    required: false,
    type: Boolean,
    description: "Set to true to execute the import; omit for preview only",
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  importYardMoves(@UploadedFile() file: Express.Multer.File, @Query("confirm") confirm?: string) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.importService.importYardMoves(file.buffer, confirm === "true");
  }
}
