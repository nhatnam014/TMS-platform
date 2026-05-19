import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../config/prisma.service";
import { ENTITY_TYPES } from "@tms/shared";
import { AuditService } from "../audit/audit.service";
import bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) throw new UnauthorizedException();
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException();
    return user;
  }

  async login(username: string, password: string) {
    try {
      const user = await this.validateUser(username, password);
      const payload = { sub: user.id, username: user.username, role: user.role };
      const token = { access_token: this.jwtService.sign(payload) };

      await this.auditService.log({
        action: "LOGIN",
        entityType: ENTITY_TYPES.USER,
        entityId: user.id,
        summary: `User ${user.username} logged in`,
        actorUserId: user.id,
        actorUsername: user.username,
        actorRole: user.role,
      });

      return token;
    } catch (err) {
      await this.auditService.log({
        action: "LOGIN_FAILED",
        entityType: ENTITY_TYPES.USER,
        summary: `Failed login attempt for username: ${username}`,
        metadata: { username },
      });
      throw err;
    }
  }
}
