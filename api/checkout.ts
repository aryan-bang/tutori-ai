import { dodo, json, productId, supabaseAdmin, type Billing, type PlanSlug } from './_lib.js'

// POST /api/checkout  { plan: 'pro' | 'mentor', billing: 'monthly' | 'annual' }
// Header: Authorization: Bearer <supabase access token>
export async function POST(request: Request) {
  if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Payments are not configured yet.' }, 503)
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Please sign in first.' }, 401)

  const { data, error } = await supabaseAdmin().auth.getUser(token)
  const user = data.user
  if (error || !user?.email) return json({ error: 'Please sign in again.' }, 401)

  let body: { plan?: string; billing?: string }
  try { body = await request.json() } catch { return json({ error: 'Bad request.' }, 400) }
  if (body.plan !== 'pro' && body.plan !== 'mentor') return json({ error: 'Unknown plan.' }, 400)
  if (body.billing !== 'monthly' && body.billing !== 'annual') return json({ error: 'Unknown billing period.' }, 400)
  const plan: PlanSlug = body.plan
  const billing: Billing = body.billing

  const product = productId(plan, billing)
  if (!product) return json({ error: 'That plan is not available yet.' }, 503)

  const site = (process.env.SITE_URL ?? new URL(request.url).origin).replace(/\/$/, '')
  try {
    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: product, quantity: 1 }],
      customer: { email: user.email, name: (user.user_metadata?.name as string | undefined) || undefined },
      metadata: { user_id: user.id, plan, billing },
      return_url: `${site}/?checkout=return`,
    })
    if (!session.checkout_url) return json({ error: 'Could not start checkout.' }, 502)
    return json({ url: session.checkout_url })
  } catch (e) {
    console.error('checkout failed', e)
    // Only the HTTP status is shown to the browser; the full error stays in the server logs.
    const status = (e as { status?: number })?.status
    return json({ error: `Could not start checkout${status ? ` (payment provider replied ${status})` : ''}. Please try again.` }, 502)
  }
}
