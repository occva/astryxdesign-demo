import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {IS_PUBLIC_ROUTE, REQUIRED_PERMISSION} from './auth.constants.js';
import {AuthService} from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: {authorization?: string};
      authUser?: Awaited<ReturnType<AuthService['authenticate']>>;
    }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException({code:'AUTH_REQUIRED'});

    const user = await this.auth.authenticate(authorization.slice('Bearer '.length));
    request.authUser = user;
    const requiredPermission = this.reflector.getAllAndOverride<string>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredPermission && !user.permissionCodes.includes(requiredPermission)) {
      throw new ForbiddenException({code:'PERMISSION_DENIED'});
    }
    return true;
  }
}
