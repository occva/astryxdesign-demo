import {SetMetadata} from '@nestjs/common';
import {IS_PUBLIC_ROUTE, REQUIRED_PERMISSION} from './auth.constants.js';

export const PublicRoute = () => SetMetadata(IS_PUBLIC_ROUTE, true);
export const RequirePermission = (permission: string) => SetMetadata(REQUIRED_PERMISSION, permission);
