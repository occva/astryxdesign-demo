import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {RolesController} from './roles.controller.js';
import {RolesService} from './roles.service.js';

@Module({
  imports: [SupabaseModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
