import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { AuditContextService } from "./audit-context.service";

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(private readonly auditContextService: AuditContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId?: string; username?: string; role?: string } | undefined;

    const ipAddress =
      (request.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      request.ip;

    const ctx = {
      userId: user?.userId,
      username: user?.username,
      role: user?.role,
      ipAddress,
      userAgent: request.headers["user-agent"] as string | undefined,
    };

    return new Observable((subscriber) => {
      this.auditContextService.run(ctx, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
