import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {AuthController} from './auth.controller.js';
import {AuthGuard} from './auth.guard.js';
import {AuthService} from './auth.service.js';
import {FilesModule} from '../files/files.module.js';
import {AuthRateLimitService} from './auth-rate-limit.service.js';

@Module({
  imports: [SupabaseModule, FilesModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AuthRateLimitService],
  exports: [AuthService, AuthGuard, AuthRateLimitService],
})
export class AuthModule {}
