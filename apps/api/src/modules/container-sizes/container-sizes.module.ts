import { Module } from "@nestjs/common";
import { ContainerSizesController } from "./container-sizes.controller";
import { ContainerSizesService } from "./container-sizes.service";

@Module({
  controllers: [ContainerSizesController],
  providers: [ContainerSizesService],
})
export class ContainerSizesModule {}
