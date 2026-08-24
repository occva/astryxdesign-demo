import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {RequirePermission} from '../auth/auth.decorators.js';
import type {AuthenticatedUser} from '../auth/auth.service.js';
import {ResourceQueryDto} from '../common/resource-query.dto.js';
import {SetPasswordDto} from '../common/set-password.dto.js';
import {CreateUserDto} from './dto/create-user.dto.js';
import {UpdateUserDto} from './dto/update-user.dto.js';
import {UsersService} from './users.service.js';

type AuthenticatedRequest = {authUser: AuthenticatedUser};

@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @RequirePermission('users.read')
  @Get()
  findAll(@Query() query: ResourceQueryDto, @Req() request: AuthenticatedRequest) {
    return this.users.findAll(query, request.authUser);
  }

  @RequirePermission('users.assign_roles')
  @Get('assignable-roles')
  assignableRoles(@Req() request: AuthenticatedRequest) {
    return this.users.assignableRoles(request.authUser);
  }

  @RequirePermission('users.create')
  @Post()
  create(@Body() dto: CreateUserDto, @Req() request: AuthenticatedRequest) {
    return this.users.create(dto, request.authUser);
  }

  @RequirePermission('users.update')
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.users.update(id, dto, request.authUser);
  }

  @RequirePermission('users.delete')
  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.users.remove(id, request.authUser);
  }

  @RequirePermission('users.manage_auth')
  @Post(':id/auth')
  provisionAuth(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetPasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.users.provisionAuth(id, dto.password, request.authUser);
  }

  @RequirePermission('users.manage_auth')
  @Patch(':id/auth/password')
  resetAuthPassword(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetPasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.users.resetAuthPassword(id, dto.password, request.authUser);
  }
}
