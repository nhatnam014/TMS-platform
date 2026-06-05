import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../audit/roles.guard";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

interface AuthenticatedRequest {
  user: { userId: string; username: string; role: string };
}

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: "List all users (ADMIN only)" })
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create a new user (ADMIN only)" })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user role or isActive (ADMIN only)" })
  update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    return this.userService.update(id, dto, req.user.userId);
  }

  @Patch(":id/reset-password")
  @ApiOperation({ summary: "Reset a user's password (ADMIN only)" })
  resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(id, dto.newPassword);
  }
}
