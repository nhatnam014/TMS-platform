import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@tms/db";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientUnknownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode: number;
    let message: string;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2002":
          statusCode = HttpStatus.CONFLICT;
          message = "Dữ liệu đã tồn tại";
          break;
        case "P2003":
          statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
          message = "Dữ liệu tham chiếu không hợp lệ hoặc không còn tồn tại";
          break;
        case "P2025":
          statusCode = HttpStatus.NOT_FOUND;
          message = "Bản ghi không tồn tại";
          break;
        case "P2000":
          statusCode = HttpStatus.BAD_REQUEST;
          message = "Giá trị vượt quá độ dài cho phép";
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          message = "Lỗi cơ sở dữ liệu";
      }
    } else {
      console.error("[PrismaExceptionFilter] PrismaClientUnknownRequestError:", exception);
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      message = "Dữ liệu không hợp lệ (lỗi cơ sở dữ liệu)";
    }

    response.status(statusCode).json({ statusCode, message });
  }
}
