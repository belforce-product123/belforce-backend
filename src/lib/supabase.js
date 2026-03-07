import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let cachedClient = null;

function normalizeSupabaseKey(value) {
  if (!value) return null;
  let key = String(value).trim();
  // Common copy/paste mistake: leading "Y" before JWT.
  if (key.startsWith('YeyJ')) key = key.slice(1);
  return key;
}

function getSupabaseKey() {
  if (config.supabase.serviceRoleKey) return normalizeSupabaseKey(config.supabase.serviceRoleKey);
  if (config.supabase.anonKey) return normalizeSupabaseKey(config.supabase.anonKey);
  return null;
}

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const url = config.supabase.url;
  const key = getSupabaseKey();

  if (!url) {
    const err = new Error('Missing SUPABASE_URL');
    err.statusCode = 500;
    throw err;
  }

  if (!key) {
    const err = new Error('Missing SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY');
    err.statusCode = 500;
    throw err;
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
}

