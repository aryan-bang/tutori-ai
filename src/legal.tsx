import { useEffect, type ReactNode } from 'react'
import { LEGAL_UPDATED, SUPPORT_EMAIL } from './data'

type Page = { title: string; body: ReactNode }

const H = ({ children }: { children: ReactNode }) => (
  <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: '#F5F7FF', margin: '36px 0 10px' }}>{children}</h2>
)
const P = ({ children }: { children: ReactNode }) => (
  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9AA3B8', lineHeight: 1.75, margin: '0 0 12px' }}>{children}</p>
)
const L = ({ items }: { items: ReactNode[] }) => (
  <ul style={{ margin: '0 0 12px', paddingLeft: 20, fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#9AA3B8', lineHeight: 1.75 }}>
    {items.map((x, i) => <li key={i}>{x}</li>)}
  </ul>
)
const Mail = () => <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#B6FF3B' }}>{SUPPORT_EMAIL}</a>

const PAGES: Record<string, Page> = {
  '/terms': {
    title: 'Terms of Service',
    body: (
      <>
        <P>These terms govern your use of the Tutori AI website and service ("Tutori AI", "we", "us"). By creating an account or using the service you agree to them. If you do not agree, do not use it.</P>
        <H>1. What Tutori AI is</H>
        <P>Tutori AI is a software service for GMAT and GRE test preparation. It provides a diagnostic, practice questions with explanations, a score and study planner, and a tool that turns notes you upload into practice questions. All of this is delivered by software. Optional sessions with human tutors are planned but are not offered or sold at this time.</P>
        <H>2. No guarantee of results</H>
        <P>Score projections and diagnostics are rough estimates from a small sample of questions. They are not predictions of your official exam score. We do not guarantee any score, improvement or admission outcome. Tutori AI is not affiliated with or endorsed by GMAC, ETS or any test provider.</P>
        <H>3. Your account</H>
        <P>You must give a valid email address and keep your password secure. You are responsible for activity on your account. You must be at least 16 years old, or have a parent or guardian's permission, to use the service.</P>
        <H>4. Paid plans and billing</H>
        <L items={[
          'The Pro plan is a subscription that renews each month or each year until you cancel. Prices are shown on the pricing page before you pay.',
          'Payments are processed by Dodo Payments, which acts as the merchant of record for your purchase. Your payment details are entered on Dodo\'s page and are not stored by us.',
          'Taxes may be added at checkout depending on where you live.',
          'You can cancel at any time from the billing portal in your account. Cancelling stops future renewals. You keep access until the end of the period you have paid for.',
          'Refunds are described in our Refund Policy.',
        ]} />
        <H>5. Acceptable use</H>
        <P>Do not misuse the service. In particular, do not attempt to break or overload it, access other people's accounts or data, resell or copy the content at scale, or use it for anything unlawful. We may suspend accounts that do.</P>
        <H>6. Your content</H>
        <P>Notes you upload are processed in your browser to create practice questions. You keep ownership of your notes. Do not upload anything you do not have the right to use.</P>
        <H>7. Our content</H>
        <P>The site, software, questions and explanations belong to us or our licensors. You may use them for your own study but not copy, resell or republish them.</P>
        <H>8. Availability and changes</H>
        <P>The service is provided "as is" and may have errors or downtime. We may change or remove features, and we may update these terms. If we make an important change we will update the date below. Continuing to use the service after a change means you accept it.</P>
        <H>9. Liability</H>
        <P>To the extent the law allows, we are not liable for indirect or consequential losses, or for any loss from relying on practice results or estimates. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under law that cannot be excluded.</P>
        <H>10. Contact</H>
        <P>Questions about these terms: <Mail />.</P>
      </>
    ),
  },
  '/privacy': {
    title: 'Privacy Policy',
    body: (
      <>
        <P>This policy explains what information Tutori AI collects, why, and the choices you have.</P>
        <H>1. What we collect</H>
        <L items={[
          <><strong>Account data:</strong> your email address and a password (stored by our authentication provider in hashed form, never in plain text).</>,
          <><strong>Plan data:</strong> which plan you have, its status, and identifiers that link your account to your payment provider record.</>,
          <><strong>Information you give us:</strong> details you enter in forms such as the waitlist (name, email, exam, test date).</>,
          <><strong>Study data saved on your device:</strong> diagnostic results and form entries are stored in your browser's local storage. Notes you upload are read in your browser and are not sent to our servers.</>,
          <><strong>Usage data:</strong> we use Microsoft Clarity, which records how visitors use pages (clicks, scrolling and similar interactions, and may include session recordings and heatmaps) to help us improve the site. Clarity may set cookies and processes data under Microsoft's privacy statement.</>,
        ]} />
        <P>We do not see your card details. Payments are handled by Dodo Payments.</P>
        <H>2. How we use it</H>
        <L items={[
          'To run your account, show your plan and unlock paid features.',
          'To process payments, prevent fraud and meet legal obligations.',
          'To reply to you and send messages you asked for, such as waitlist updates.',
          'To understand how the site is used and fix problems.',
        ]} />
        <H>3. Who we share it with</H>
        <P>We use service providers to run the site. They process data only to provide their service:</P>
        <L items={[
          'Supabase: account sign-in and plan records.',
          'Dodo Payments: checkout, payments, invoices and the billing portal.',
          'Vercel: website hosting.',
          'Microsoft Clarity: site analytics.',
        ]} />
        <P>We do not sell your personal information. We may disclose information if the law requires it.</P>
        <H>4. How long we keep it</H>
        <P>We keep account and plan records while your account is active and for as long afterwards as needed for legal, tax or fraud-prevention reasons. Data stored in your browser stays there until you clear it.</P>
        <H>5. Your choices</H>
        <P>You can ask us to access, correct or delete your account data by emailing <Mail />. You can clear data stored on your device by clearing your browser's site data. You can block cookies and analytics with your browser settings or a content blocker. Depending on where you live, you may have further rights under local privacy law, and we will respect them.</P>
        <H>6. Security</H>
        <P>We use reputable providers and encrypted connections, and we limit who can access plan records. No online service is completely secure.</P>
        <H>7. Children</H>
        <P>Tutori AI is not aimed at children under 16. If you believe a child has given us information, email us and we will delete it.</P>
        <H>8. Changes</H>
        <P>We may update this policy. The date at the bottom shows the latest version.</P>
        <H>9. Contact</H>
        <P>Privacy questions: <Mail />.</P>
      </>
    ),
  },
  '/refunds': {
    title: 'Refund Policy',
    body: (
      <>
        <P>We want you to be able to try Tutori AI with confidence.</P>
        <H>First payment: 7 days</H>
        <P>If you are not satisfied, email <Mail /> within 7 days of your first payment for a plan and we will refund that payment in full. Include the email address you used to sign up.</P>
        <H>Renewals</H>
        <P>Renewal payments are not refundable, so please cancel before your renewal date if you do not want to continue. Where the law gives you a right to a refund, for example after a billing error or a duplicate charge, we will honour it.</P>
        <H>How to cancel</H>
        <P>Sign in, open Account, and choose Manage billing. You can cancel there at any time. You keep access until the end of the period you paid for.</P>
        <H>How refunds are paid</H>
        <P>Refunds go back to the original payment method through our payment provider, Dodo Payments. They usually take 5 to 10 business days to appear, depending on your bank.</P>
        <H>No guarantee of results</H>
        <P>We do not offer a score guarantee. Tutori AI helps you practise, but we cannot promise a particular result on an official exam.</P>
        <H>Contact</H>
        <P><Mail /></P>
      </>
    ),
  },
  '/contact': {
    title: 'Contact',
    body: (
      <>
        <P>For help with your account, billing, a refund or any question about Tutori AI, email us at <Mail />. We aim to reply within 2 business days.</P>
        <P>Please include the email address you used to sign up so we can find your account.</P>
      </>
    ),
  },
}

export const isLegalPath = (path: string) => path.replace(/\/$/, '') in PAGES

export function LegalPage({ path }: { path: string }) {
  const page = PAGES[path.replace(/\/$/, '')]
  useEffect(() => {
    document.title = `${page.title} · Tutori AI`
    window.scrollTo(0, 0)
  }, [page])

  return (
    <div style={{ minHeight: '100vh', background: '#05060A' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: '#F5F7FF', textDecoration: 'none' }}>
            Tutori <span style={{ color: '#7C5CFF' }}>AI</span>
          </a>
          <a href="/" style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9AA3B8', textDecoration: 'none' }}>← Back to site</a>
        </div>
      </header>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px' }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(30px,5vw,44px)', color: '#F5F7FF', letterSpacing: '-0.03em', margin: '0 0 6px' }}>{page.title}</h1>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#9AA3B8', margin: '0 0 24px' }}>Last updated {LEGAL_UPDATED}</p>
        {page.body}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
          {Object.entries(PAGES).map(([p, v]) => <a key={p} href={p} style={{ color: '#9AA3B8' }}>{v.title}</a>)}
        </div>
      </main>
    </div>
  )
}
