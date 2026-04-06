import 'dotenv/config';

/**
 * Centralised configuration.
 * All env vars are read here and exported as a typed plain object.
 * Never import `process.env` directly outside of this file.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config = {
  server: {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    isDev: (process.env['NODE_ENV'] ?? 'development') === 'development',
  },
  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },
  timeapi: {
    baseUrl: process.env['TIMEAPI_BASE_URL'] ?? 'https://timeapi.io/api',
  },
  app: {
    timezone: process.env['APP_TIMEZONE'] ?? 'America/Argentina/Buenos_Aires',
    corsOrigin: process.env['APP_CORS_ORIGIN'] ?? '*',
  },
};

export type Config = typeof config;
export default config;
