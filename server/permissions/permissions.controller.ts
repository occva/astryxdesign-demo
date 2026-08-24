import {Body, Controller, Get, Inject, Param, ParseUUIDPipe, Put, Req} from '@nestjs/common';
import {RequirePermission} from '../auth/auth.decorators.js';
import type {AuthenticatedUser} from '../auth/auth.service.js';
import {ReplacePermissionsDto} from './dto/replace-permissions.dto.js';
import {PermissionsService} from './permissions.service.js';

type AuthenticatedRequest = {authUser: AuthenticatedUser};

@Controller('roles/:roleId/permissions')
export class PermissionsController {
  constructor(@Inject(PermissionsService) private readonly service: PermissionsService) {}

  @RequirePermission('role_permissions.read')
  @Get()
  find(@Param('roleId', ParseUUIDPipe) id: string, @Req() request: AuthenticatedRequest) {
    return this.service.findByRole(id, request.authUser);
  }

  @RequirePermission('role_permissions.manage')
  @Put()
  replace(
    @Param('roleId', ParseUUIDPipe) id: string,
    @Body() dto: ReplacePermissionsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.replace(id, dto, request.authUser);
  }
}
