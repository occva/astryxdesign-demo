import {Controller, Get, Inject, Param, ParseUUIDPipe, Put, Req} from '@nestjs/common';
import {RequirePermission} from '../auth/auth.decorators.js';
import type {AuthenticatedUser} from '../auth/auth.service.js';
import {NotificationsService} from './notifications.service.js';

type AuthenticatedRequest = {authUser: AuthenticatedUser};

@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly service: NotificationsService) {}

  @RequirePermission('notifications.read')
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.service.findAll(request.authUser.id);
  }

  @RequirePermission('notifications.update')
  @Put('read-all')
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.service.markAllRead(request.authUser.id);
  }

  @RequirePermission('notifications.update')
  @Put(':id/read')
  markRead(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.markRead(request.authUser.id, id);
  }
}
