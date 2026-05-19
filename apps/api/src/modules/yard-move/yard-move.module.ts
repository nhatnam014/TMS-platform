import { Module } from "@nestjs/common";
import { YardMoveController } from "./yard-move.controller";
import { YardMoveService } from "./yard-move.service";

@Module({
  controllers: [YardMoveController],
  providers: [YardMoveService],
})
export class YardMoveModule {}
