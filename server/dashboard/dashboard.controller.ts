import {Controller, Get, Inject} from '@nestjs/common';
import {RequirePermission} from '../auth/auth.decorators.js';
import {DashboardService} from './dashboard.service.js';

@RequirePermission('dashboard.read')
@Controller('dashboard')
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly service: DashboardService) {}
  @Get() getDashboard() { return this.service.getDashboard(); }
}
