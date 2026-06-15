import { Module } from "@nestjs/common";
import { CostTemplatesController } from "./cost-templates.controller";
import { CostTemplatesService } from "./cost-templates.service";

@Module({
  controllers: [CostTemplatesController],
  providers: [CostTemplatesService],
})
export class CostTemplatesModule {}
