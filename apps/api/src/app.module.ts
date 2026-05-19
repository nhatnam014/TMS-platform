import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./config/prisma.service";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ContainerModule } from "./modules/container/container.module";
import { TripPlanModule } from "./modules/trip-plan/trip-plan.module";
import { VehicleModule } from "./modules/vehicle/vehicle.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { YardMoveModule } from "./modules/yard-move/yard-move.module";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuditModule,
    AuthModule,
    ContainerModule,
    TripPlanModule,
    VehicleModule,
    DashboardModule,
    YardMoveModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
