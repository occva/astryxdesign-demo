import {Inject, Injectable} from '@nestjs/common';
import {databaseError} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';

@Injectable()
export class NotificationsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async findAll(userId: string) {
    const now = new Date().toISOString();
    const {data, error} = await this.supabase.database
      .from('notifications')
      .select('id,title,description,status,created_at,i18n_key,reads:notification_reads(user_id)')
      .eq('active', true)
      .eq('reads.user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', {ascending: false});
    if (error) throw databaseError(error.message, error.code);
    return (data ?? []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      occurredAt: item.created_at,
      status: item.status,
      isRead: item.reads.length > 0,
      i18nKey: item.i18n_key ?? '',
    }));
  }

  async markRead(userId: string, notificationId: string) {
    const {error} = await this.supabase.database
      .from('notification_reads')
      .upsert({user_id: userId, notification_id: notificationId}, {onConflict: 'user_id,notification_id'});
    if (error) throw databaseError(error.message, error.code);
    return {updated: true};
  }

  async markAllRead(userId: string) {
    const {data, error} = await this.supabase.database
      .from('notifications')
      .select('id')
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    if (error) throw databaseError(error.message, error.code);
    if ((data ?? []).length > 0) {
      const {error: upsertError} = await this.supabase.database
        .from('notification_reads')
        .upsert((data ?? []).map(item => ({user_id: userId, notification_id: item.id})), {onConflict: 'user_id,notification_id'});
      if (upsertError) throw databaseError(upsertError.message, upsertError.code);
    }
    return {updated: true};
  }
}
