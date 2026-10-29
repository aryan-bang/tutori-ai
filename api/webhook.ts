import { dodo, json, planFromProduct, rest } from './_lib.js'

// Dodo calls this after a payment or subscription change. This, not the browser
// redirect, is what grants access.
const ACTIVE = new Set(['subscription.active', 'subscription.renewed', 'subscription.plan_changed'])
const PAUSED = new Set(['subscription.on_hold', 'subscription.failed'])
const ENDED = new Set(['subscription.cancelled', 'subscription.expired'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Record<string, any>

export async function POST(request: Request) {
  const raw = await request.text()
  let event: { type: string; timestamp?: string; data: Data }
  try {
    event = dodo().webhooks.unwrap(raw, {
      headers: {
        'webhook-id': request.headers.get('webhook-id') ?? '',
        'webhook-signature': request.headers.get('webhook-signature') ?? '',
        'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
      },
    }) as unknown as typeof event
  } catch {
    return json({ error: 'Invalid signature' }, 401)
  }

  const { type, data } = event
  let status: 'active' | 'past_due' | 'inactive' | null = null
  if (ACTIVE.has(type)) status = 'active'
  else if (PAUSED.has(type)) status = 'past_due'
  else if (ENDED.has(type)) status = 'inactive'
  else if (type === 'payment.succeeded' && !data.subscription_id) status = 'active' // one-time purchase
  if (!status) return json({ received: true }) // event we don't act on

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Not configured' }, 503)
  const email: string | undefined = data.customer?.email

  let userId: string | undefined = data.metadata?.user_id
  if (!userId && email) {
    const r = await rest(`profiles?select=id&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`)
    userId = (r.data as { id: string }[] | null)?.[0]?.id
  }
  if (!userId) {
    console.error('webhook: could not match a user', type, data.payment_id ?? data.subscription_id)
    return json({ received: true }) // 2xx so Dodo doesn't retry something we can't fix
  }

  const eventAt = event.timestamp ?? new Date().toISOString()
  // Events can arrive out of order: ignore anything older than what we've stored.
  const prev = await rest(`entitlements?select=event_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`)
  const stored = (prev.data as { event_at: string }[] | null)?.[0]?.event_at
  if (stored && new Date(stored) > new Date(eventAt)) return json({ received: true })

  const plan = planFromProduct(data.product_id) ?? (data.metadata?.plan === 'mentor' ? 'mentor' : 'pro')
  const saved = await rest('entitlements?on_conflict=user_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: {
      user_id: userId,
      plan,
      status,
      dodo_customer_id: data.customer?.customer_id ?? null,
      dodo_subscription_id: data.subscription_id ?? null,
      product_id: data.product_id ?? null,
      current_period_end: data.next_billing_date ?? null,
      event_at: eventAt,
      updated_at: new Date().toISOString(),
    },
  })
  if (!saved.ok) {
    console.error('webhook: save failed', saved.status, saved.text)
    return json({ error: 'Could not save' }, 500) // non-2xx so Dodo retries
  }
  return json({ received: true })
}
