# Turning on accounts and payments

Until the keys below are set, the site works as before: no login, and the plan
buttons open the waitlist form. Use **test mode** everywhere until you are ready for real money.

## 1. Supabase (login + who has paid)
1. Create a project at supabase.com.
2. SQL Editor -> paste `supabase/schema.sql` -> Run.
3. Project Settings -> API: copy the **Project URL**, the **anon** key and the **service_role** key.
4. Authentication -> Providers -> Email: turn "Confirm email" off while testing (or leave on; users must click the email link).
5. Authentication -> URL Configuration: set Site URL to your site address.

## 2. Dodo Payments (test mode)
1. In the Dodo dashboard switch to **Test mode**.
2. Create 4 subscription products: Pro monthly ($39), Pro annual ($29/mo billed yearly), Pro + Mentor monthly ($89), Pro + Mentor annual ($69/mo billed yearly). Copy each `pdt_...` id.
3. Developer -> API Keys: create a test API key.
4. Developer -> Webhooks: add endpoint `https://www.tutoriai.tech/api/webhook`, subscribe to `subscription.*` and `payment.succeeded`, copy the signing secret (`whsec_...`).

## 3. Vercel environment variables
Project -> Settings -> Environment Variables, then **redeploy**. Names are listed in `.env.example`.

## 4. Test it
Sign up on the site -> click Start Pro -> pay with Dodo's test card (4242 4242 4242 4242, any future date, any CVC) -> you land back on the site and your plan shows under Account.

## Going live
Switch Dodo to live mode, create live products and a live API key and webhook, update the Vercel variables
(`DODO_PAYMENTS_ENVIRONMENT=live_mode`) and redeploy.
