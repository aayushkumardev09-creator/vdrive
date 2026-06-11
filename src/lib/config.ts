export type RequiredEnvKey =
  | 'VITE_SUPABASE_URL'
  | 'VITE_SUPABASE_ANON_KEY'
  | 'VITE_SENTRY_DSN';

export type MissingEnv = {
  key: RequiredEnvKey;
  value: string | undefined;
};

const REQUIRED_KEYS: RequiredEnvKey[] = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

function envValue(key: RequiredEnvKey): string | undefined {
  const v = import.meta.env[key];
  if (typeof v !== 'string') return undefined;
  return v.trim() === '' ? undefined : v;
}

export function validateEnvOrThrow(): void {
  const prod = import.meta.env.PROD;
  const missing: MissingEnv[] = REQUIRED_KEYS.map((key) => ({
    key,
    value: envValue(key),
  })).filter((x) => !x.value);

  if (missing.length === 0) return;

  const message =
    `Missing required environment variables: ${missing.map((m) => m.key).join(', ')}`;

  // Fail fast in production to avoid silent placeholder fallbacks.
  if (prod) {
    throw new Error(message);
  }

  // In non-prod, keep app usable.
  // eslint-disable-next-line no-console
  console.warn(message);
}

