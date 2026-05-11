import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Skill-Print',
  description: 'How Skill-Print collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img src="/logo.svg" alt="Skill-Print" className="h-7 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-brand-700 transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Effective date: April 14, 2026 · Last updated: April 14, 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The short version</h2>
            <p>
              Skill-Print collects only what it needs to run the product. We don't sell your data.
              We don't share it with advertisers. The sensitive stuff — your password and your payment
              details — never touches our servers. Here's the full picture.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Who we are</h2>
            <p>
              Skill-Print is operated by Chelsey Gover-Price, a sole proprietor based in the United States.
              You can reach us at{' '}
              <a href="mailto:clareerhq@gmail.com" className="text-brand-700 hover:underline">
                clareerhq@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">What we collect and why</h2>

            <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Account information</h3>
            <p>
              When you create an account, we collect your name and email address through Clerk,
              our authentication provider. Skill-Print never sees or stores your password — Clerk
              handles that entirely using industry-standard security practices.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Assessment data</h3>
            <p>
              When you complete a Skill-Print assessment, we store the occupation you selected
              and the ratings you entered (0–3 scores for each skill dimension). This is the core
              data that powers your Skill-Print report. We store it so you can revisit and
              re-download your report at any time.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Payment information</h3>
            <p>
              Payments are processed by Stripe, a PCI Level 1 certified payment processor.
              Skill-Print never sees, receives, or stores your credit card number or billing details.
              Stripe provides us with a customer ID and confirmation that a payment was made —
              nothing more.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Usage data</h3>
            <p>
              We use PostHog to collect anonymized, aggregated usage analytics — things like
              which steps of the assessment are completed and where people drop off. This helps
              us improve the product. We do not track you across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">What we don't do</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>We do not sell your data to anyone, ever.</li>
              <li>We do not share your data with advertisers.</li>
              <li>We do not use your assessment data to train AI models.</li>
              <li>We do not send marketing email without your explicit opt-in.</li>
              <li>We do not use dark patterns — no hidden fees, no pre-checked upsell boxes,
                  no buried cancellation flows.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The O*NET data</h2>
            <p>
              The occupational skills data that powers your Skill-Print comes from O*NET,
              the U.S. Department of Labor's occupational database. This is publicly available
              federal data. We use it to generate your assessment — we don't share your
              responses back to O*NET or any government body.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How we store your data</h2>
            <p>
              Your account and assessment data is stored in a PostgreSQL database hosted by Neon,
              encrypted at rest and in transit. Skill-Print is hosted on Vercel, which enforces
              HTTPS on all connections. Access to the database is restricted to Skill-Print's
              application infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your rights</h2>
            <p>
              You can request a copy of your data, correction of inaccurate data, or deletion
              of your account and all associated data at any time by emailing{' '}
              <a href="mailto:clareerhq@gmail.com" className="text-brand-700 hover:underline">
                clareerhq@gmail.com
              </a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies</h2>
            <p>
              Skill-Print uses only functional cookies necessary to keep you signed in and
              maintain your session. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Children's privacy</h2>
            <p>
              Skill-Print is not directed at children under 13. We do not knowingly collect
              personal information from anyone under 13. If you believe we have inadvertently
              collected such information, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to this policy</h2>
            <p>
              If we make material changes to this policy, we will update the effective date
              at the top of this page and notify registered users by email. Continued use of
              Skill-Print after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
            <p>
              Questions about this policy? Email us at{' '}
              <a href="mailto:clareerhq@gmail.com" className="text-brand-700 hover:underline">
                clareerhq@gmail.com
              </a>.
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-6">
          <Link href="/privacy" className="hover:text-brand-600">Privacy</Link>
          <Link href="/terms" className="hover:text-brand-600">Terms</Link>
          <Link href="/" className="hover:text-brand-600">Home</Link>
        </div>
      </footer>
    </div>
  );
}
