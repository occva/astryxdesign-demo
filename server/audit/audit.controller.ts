import {Controller,Get,Inject,Query} from '@nestjs/common';
import {RequirePermission} from '../auth/auth.decorators.js';
import {ResourceQueryDto} from '../common/resource-query.dto.js';
import {AuditService} from './audit.service.js';

@Controller('audit-logs')
export class AuditController {
  constructor(@Inject(AuditService) private readonly audit:AuditService) {}
  @RequirePermission('audit_logs.read') @Get() findAll(@Query() query:ResourceQueryDto){return this.audit.findAll(query);}
}
