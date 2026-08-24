import {Injectable, ServiceUnavailableException} from '@nestjs/common';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient | null;

  constructor() {
    const {SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey} = process.env;
    this.client = url && serviceRoleKey
      ? createClient(url, serviceRoleKey, {
          auth: {persistSession: false, autoRefreshToken: false},
        })
      : null;
  }

  get database(): SupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'NestJS database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    return this.client;
  }

  passwordAuthEmail(account: string) {
    const url = process.env.SUPABASE_URL;
    const projectRef = url ? new URL(url).hostname.split('.')[0] : '';
    if (!projectRef) {
      throw new ServiceUnavailableException(
        'Password authentication is not configured. Set SUPABASE_URL.',
      );
    }
    return `${account.trim().toLowerCase()}@${projectRef}.supabase.test`;
  }

  createPasswordAuthClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      throw new ServiceUnavailableException(
        'Password authentication is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.',
      );
    }
    return createClient(url, publishableKey, {
      auth: {persistSession: false, autoRefreshToken: false},
    });
  }
}
