import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {NotificationsController} from './notifications.controller.js';
import {NotificationsService} from './notifications.service.js';

@Module({imports: [SupabaseModule], controllers: [NotificationsController], providers: [NotificationsService]})
export class NotificationsModule {}
