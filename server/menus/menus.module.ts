import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {MenusController} from './menus.controller.js';
import {MenusService} from './menus.service.js';

@Module({
  imports: [SupabaseModule],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
