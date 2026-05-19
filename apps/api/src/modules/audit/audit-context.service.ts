import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

export interface AuditContext {
  userId?: string;
  username?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContext>();

  run<T>(ctx: AuditContext, fn: () => T): T {
    return this.storage.run(ctx, fn);
  }

  get(): AuditContext | undefined {
    return this.storage.getStore();
  }
}
