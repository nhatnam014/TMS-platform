import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./config/prisma.service";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CarrierModule } from "./modules/carrier/carrier.module";
import { ContainerModule } from "./modules/container/container.module";
import { DriverModule } from "./modules/driver/driver.module";
import { CustomerModule } from "./modules/customer/customer.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ExportModule } from "./modules/export/export.module";
import { ImportModule } from "./modules/import/import.module";
import { LocationModule } from "./modules/location/location.module";
import { TripPlanModule } from "./modules/trip-plan/trip-plan.module";
import { VehicleModule } from "./modules/vehicle/vehicle.module";
import { UserModule } from "./modules/user/user.module";
import { YardMoveModule } from "./modules/yard-move/yard-move.module";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        ".env",
        "../../.env", // ← thêm dòng này để đọc root .env
      ],
    }),
    AuditModule,
    AuthModule,
    CarrierModule,
    ContainerModule,
    CustomerModule,
    DashboardModule,
    DriverModule,
    ExportModule,
    ImportModule,
    LocationModule,
    TripPlanModule,
    UserModule,
    VehicleModule,
    YardMoveModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
