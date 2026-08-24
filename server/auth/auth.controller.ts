import {BadRequestException,Body, Controller, Get, Headers, HttpCode, HttpStatus, Inject, Post, Req, UnauthorizedException,UploadedFile,UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import type {AuthenticatedUser} from './auth.service.js';
import {SetPasswordDto} from '../common/set-password.dto.js';
import {PublicRoute} from './auth.decorators.js';
import {AuthService} from './auth.service.js';
import {LoginDto} from './dto/login.dto.js';
import {RegisterDto} from './dto/register.dto.js';
import {RefreshSessionDto} from './dto/refresh-session.dto.js';
import {UpdateProfileDto} from './dto/update-profile.dto.js';
import {AuthRateLimitService} from './auth-rate-limit.service.js';

type AuthenticatedRequest = {authUser: AuthenticatedUser;ip?:string};
type PublicRequest = {ip?:string};
type Upload={originalname:string;mimetype:string;size:number;buffer:Buffer};

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuthRateLimitService) private readonly rateLimit: AuthRateLimitService,
  ) {}

  @PublicRoute()
  @Post('login')
  async login(@Body() dto: LoginDto,@Req() request:PublicRequest) {
    const accountIdentifier=`account:${dto.account}`;
    const ipIdentifier=`ip:${request.ip??'unknown'}`;
    this.rateLimit.consume('login-account',[accountIdentifier],Number(process.env.AUTH_LOGIN_RATE_LIMIT)||10,15*60*1000);
    this.rateLimit.consume('login-ip',[ipIdentifier],Number(process.env.AUTH_LOGIN_IP_RATE_LIMIT)||100,15*60*1000);
    try{
      const session=await this.auth.login(dto.account,dto.password);
      this.rateLimit.clear('login-account',[accountIdentifier]);
      return session;
    }catch(error){
      this.rateLimit.recordFailure('login',`account:${dto.account}`);
      throw error;
    }
  }

  @PublicRoute()
  @Post('register')
  register(@Body() dto: RegisterDto,@Req() request:PublicRequest) {
    this.rateLimit.consume('register-account',[`account:${dto.account}`],Number(process.env.AUTH_REGISTER_RATE_LIMIT)||5,60*60*1000);
    this.rateLimit.consume('register-ip',[`ip:${request.ip??'unknown'}`],Number(process.env.AUTH_REGISTER_IP_RATE_LIMIT)||20,60*60*1000);
    return this.auth.register(dto);
  }

  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshSessionDto,@Req() request:PublicRequest) {
    this.rateLimit.consume('refresh',[`ip:${request.ip??'unknown'}`],Number(process.env.AUTH_REFRESH_RATE_LIMIT)||60,60*1000);
    return this.auth.refresh(dto.refreshToken);
  }

  @Get('session')
  session(
    @Headers('authorization') authorization: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    return this.auth.session(authorization.slice('Bearer '.length), request.authUser);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    await this.auth.logout(authorization.slice('Bearer '.length));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password')
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SetPasswordDto,
  ) {
    this.rateLimit.consume('change-password',[`user:${request.authUser.id}`],5,15*60*1000);
    await this.auth.changePassword(request.authUser,dto.password);
  }

  @Post('profile')
  updateProfile(
    @Headers('authorization') authorization: string | undefined,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    return this.auth.updateProfile(authorization.slice('Bearer '.length), request.authUser, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:5*1024*1024,files:1}}))
  updateAvatar(
    @Headers('authorization') authorization: string | undefined,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Upload | undefined,
  ) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException({code:'AUTH_REQUIRED'});
    if (!file) throw new BadRequestException({code:'FILE_REQUIRED'});
    return this.auth.updateAvatar(authorization.slice('Bearer '.length), request.authUser, file);
  }
}
