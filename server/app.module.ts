import {Module} from '@nestjs/common';
import {APP_GUARD, APP_INTERCEPTOR} from '@nestjs/core';
import {AuthGuard} from './auth/auth.guard.js';
import {AuthModule} from './auth/auth.module.js';
import {UsersModule} from './users/users.module.js';
import {RolesModule} from './roles/roles.module.js';
import {DepartmentsModule} from './departments/departments.module.js';
import {MenusModule} from './menus/menus.module.js';
import {PermissionsModule} from './permissions/permissions.module.js';
import {DashboardModule} from './dashboard/dashboard.module.js';
import {NotificationsModule} from './notifications/notifications.module.js';
import {AuditModule} from './audit/audit.module.js';
import {AuditInterceptor} from './audit/audit.interceptor.js';
import {FilesModule} from './files/files.module.js';

@Module({
  imports: [
    AuthModule, UsersModule, RolesModule, DepartmentsModule, MenusModule, PermissionsModule,
    DashboardModule, NotificationsModule, AuditModule, FilesModule,
  ],
  providers: [
    {provide: APP_GUARD, useExisting: AuthGuard},
    {provide: APP_INTERCEPTOR, useExisting: AuditInterceptor},
  ],
})
export class AppModule {}
