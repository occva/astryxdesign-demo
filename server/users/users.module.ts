import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {UsersController} from './users.controller.js';
import {UsersService} from './users.service.js';
import {UserAccessPolicy} from './user-access.policy.js';

@Module({
  imports: [SupabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UserAccessPolicy],
})
export class UsersModule {}
