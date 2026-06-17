import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";

console.log("DATABASE_URL =", process.env.DATABASE_URL);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  });

  // Global filters
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API prefix
  app.setGlobalPrefix("api/v1");

  // Swagger
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("TMS Platform API")
      .setDescription("Transportation Management System — API Documentation")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚛 TMS API running on http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
