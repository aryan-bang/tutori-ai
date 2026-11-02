import { dodo, getUser, json, rest } from './_lib.js'

// POST /api/portal  Authorization: Bearer <supabase access token>
// Returns a link to Dodo's billing portal, where customers cancel or update their plan.
export async function POST(request: Request) {
  if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Billing is not configured yet.' }, 503)
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Please sign in first.' }, 401)
  const user = await getUser(token)
  if (!user) return json({ error: 'Please sign in again.' }, 401)

  const r = await rest(`entitlements?select=dodo_customer_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`)
  const customerId = (r.data as { dodo_customer_id: string | null }[] | null)?.[0]?.dodo_customer_id
  if (!customerId) return json({ error: 'No billing record found for this account yet.' }, 404)

  const site = (process.env.SITE_URL ?? new URL(request.url).origin).replace(/\/$/, '')
  try {
    const session = await dodo().customers.customerPortal.create(customerId, { return_url: site })
    return json({ url: session.link })
  } catch (e) {
    console.error('portal failed', e)
    const status = (e as { status?: number })?.status
    return json({ error: `Could not open billing${status ? ` (payment provider replied ${status})` : ''}. Please try again or email support.` }, 502)
  }
}
