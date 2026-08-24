import {Inject, Injectable} from '@nestjs/common';
import {databaseError} from '../common/resource-utils.js';
import {SupabaseService} from '../supabase/supabase.service.js';

@Injectable()
export class DashboardService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async getDashboard() {
    const [metrics, trend, modules, activities] = await Promise.all([
      this.supabase.database.from('dashboard_metrics').select('id,label,value,delta,tone,i18n_key').eq('active', true).order('sort_order'),
      this.supabase.database.from('dashboard_trends').select('id,label,value,target,i18n_key').eq('active', true).order('sort_order'),
      this.supabase.database.from('dashboard_modules').select('id,label,value,capacity,color,i18n_key').eq('active', true).order('sort_order'),
      this.supabase.database.from('dashboard_activities').select('id,title,description,occurred_at,status,i18n_key').eq('active', true).order('sort_order'),
    ]);
    const failed = [metrics, trend, modules, activities].find(result => result.error);
    if (failed?.error) throw databaseError(failed.error.message, failed.error.code);
    return {
      metrics: (metrics.data ?? []).map(item => ({label: item.label, value: item.value, delta: item.delta, tone: item.tone, i18nKey: item.i18n_key ?? ''})),
      trend: (trend.data ?? []).map(item => ({label: item.label, value: Number(item.value), target: Number(item.target), i18nKey: item.i18n_key ?? ''})),
      modules: (modules.data ?? []).map(item => ({label: item.label, value: Number(item.value), capacity: Number(item.capacity), color: item.color, i18nKey: item.i18n_key ?? ''})),
      activities: (activities.data ?? []).map(item => ({
        id: item.id, title: item.title, description: item.description, occurredAt: item.occurred_at, status: item.status, i18nKey: item.i18n_key ?? '',
      })),
    };
  }
}
