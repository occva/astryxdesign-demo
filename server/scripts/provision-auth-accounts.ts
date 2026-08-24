import 'reflect-metadata';
import {loadEnvFile} from 'node:process';
import {createClient} from '@supabase/supabase-js';

try {
  loadEnvFile();
} catch {
  // CI and deployment environments may inject variables directly.
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
if (process.env.ALLOW_AUTH_ACCOUNT_PROVISIONING !== 'true') {
  throw new Error('Set ALLOW_AUTH_ACCOUNT_PROVISIONING=true to confirm Auth account provisioning.');
}

const password = process.env.AUTH_ACCOUNT_PASSWORD;
if (!password || password.length < 6) {
  throw new Error('AUTH_ACCOUNT_PASSWORD must contain at least 6 characters.');
}
const projectRef = new URL(url).hostname.split('.')[0];
if (!projectRef) throw new Error('SUPABASE_URL must contain a valid project reference.');
if (!process.env.AUTH_ACCOUNT_PROJECT_REF || process.env.AUTH_ACCOUNT_PROJECT_REF !== projectRef) {
  throw new Error('AUTH_ACCOUNT_PROJECT_REF must exactly match the target SUPABASE_URL project reference.');
}

const accounts = (process.env.AUTH_ACCOUNTS ?? 'admin')
  .split(',')
  .map((account) => account.trim().toLowerCase())
  .filter(Boolean);
if (!accounts.length) throw new Error('AUTH_ACCOUNTS must contain at least one account.');

const supabase = createClient(url, serviceRoleKey, {
  auth: {persistSession: false, autoRefreshToken: false},
});

async function findAuthUser(email: string) {
  for (let page = 1; ; page += 1) {
    const {data, error} = await supabase.auth.admin.listUsers({page, perPage: 1000});
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
}

for (const account of accounts) {
  const {data: applicationUser, error: applicationUserError} = await supabase
    .from('users')
    .select('id,name,email,auth_user_id')
    .eq('account', account)
    .is('deleted_at', null)
    .maybeSingle();
  if (applicationUserError) throw applicationUserError;
  if (!applicationUser) throw new Error(`Application user ${account} was not found. Run seed.sql first.`);

  const authEmail = `${account}@${projectRef}.supabase.test`;
  const userMetadata = {
    account,
    name: applicationUser.name,
    business_email: applicationUser.email,
  };
  let authUser = await findAuthUser(authEmail);
  if (authUser) {
    const {data, error} = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const {data, error} = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (error) throw error;
    authUser = data.user;
  }

  const {data: linkedUser, error: linkError} = await supabase
    .from('users')
    .update({auth_user_id: authUser.id})
    .eq('id', applicationUser.id)
    .or(`auth_user_id.is.null,auth_user_id.eq.${authUser.id}`)
    .select('id')
    .maybeSingle();
  if (linkError) throw linkError;
  if (!linkedUser) throw new Error(`Application user ${account} is bound to another Supabase Auth identity.`);
  console.log(`Provisioned Supabase Auth account: ${account}`);
}
import '../config/load-env.js';
