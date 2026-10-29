import DodoPayments from 'dodopayments'
import { createClient } from '@supabase/supabase-js'

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

export const supabaseAdmin = () =>
  createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  })

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
