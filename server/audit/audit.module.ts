import {Global,Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {AuditController} from './audit.controller.js';
import {AuditInterceptor} from './audit.interceptor.js';
import {AuditService} from './audit.service.js';

@Global()
@Module({imports:[SupabaseModule],controllers:[AuditController],providers:[AuditService,AuditInterceptor],exports:[AuditService,AuditInterceptor]})
export class AuditModule {}
