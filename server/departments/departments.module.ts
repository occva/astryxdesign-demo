import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {DepartmentsController} from './departments.controller.js';
import {DepartmentsService} from './departments.service.js';

@Module({
  imports: [SupabaseModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
