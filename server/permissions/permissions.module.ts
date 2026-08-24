import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {PermissionsController} from './permissions.controller.js';
import {PermissionsService} from './permissions.service.js';

@Module({
  imports: [SupabaseModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
