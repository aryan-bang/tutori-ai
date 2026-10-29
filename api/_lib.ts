import DodoPayments from 'dodopayments'

export type PlanSlug = 'pro' | 'mentor'
export type Billing = 'monthly' | 'annual'

// Server-side allowlist: the browser only ever sends a plan slug, never a product id.
const PRODUCT_ENV: Record<PlanSlug, Record<Billing, string>> = {
  pro: { monthly: 'DODO_PRODUCT_PRO_MONTHLY', annual: 'DODO_PRODUCT_PRO_ANNUAL' },
  mentor: { monthly: 'DODO_PRODUCT_MENTOR_MONTHLY', annual: 'DODO_PRODUCT_MENTOR_ANNUAL' },
}

export const productId = (plan: PlanSlug, billing: Billing) => process.env[PRODUCT_ENV[plan][billing]]

export function planFromProduct(id: string | undefined): PlanSlug | null {
  if (!id) return null
  for (const plan of Object.keys(PRODUCT_ENV) as PlanSlug[]) {
    for (const billing of Object.keys(PRODUCT_ENV[plan]) as Billing[]) {
      if (process.env[PRODUCT_ENV[plan][billing]] === id) return plan
    }
  }
  return null
}

// Defaults to test mode so a missing variable can never charge real cards.
export const dodo = () =>
  new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode',
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  })

// Minimal Supabase REST helper (service role). Plain HTTP keeps the server code
// independent of the SDK's typings.
export async function rest(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const base = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(init.prefer ? { prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, data: text ? (JSON.parse(text) as unknown) : null, text }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

// Asks Supabase who a login token belongs to. A plain HTTP call, so it does not
// depend on the SDK's auth typings.
export async function getUser(token: string): Promise<{ id: string; email?: string; user_metadata?: { name?: string } } | null> {
  const base = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) return null
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const u = await res.json()
    return u?.id ? u : null
  } catch {
    return null
  }
}
