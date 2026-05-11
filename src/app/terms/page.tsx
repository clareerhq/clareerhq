import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Skill-Print',
  description: 'The terms that govern your use of Skill-Print.',
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-400">Effective date: April 14, 2026 · Last updated: April 14, 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The short version</h2>
            <p>
              Use Skill-Print honestly. Don't misuse the platform or try to game the assessment.
              The Skill-Print you generate is yours. We provide this service as-is and will do
              our best to keep it running reliably. Here's the full picture.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Who these terms apply to</h2>
            <p>
              These Terms of Service govern your use of Skill-Print, operated by Chelsey Gover-Price
              ("Skill-Print," "we," "us"). By using the product, you agree to these terms.
              If you don't agree, please don't use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The service</h2>
            <p>
              Skill-Print provides a skills assessment that generates your skill-print — a
              data-backed profile of your skills rated against O*NET occupational data from
              the U.S. Department of Labor. The free tier includes a 3-domain assessment and
              downloadable report. Paid tiers unlock additional features as described on the
              pricing page.
            </p>
            <p className="mt-3">
              The O*NET data we use is publicly available federal occupational information.
              Skill-Print does not guarantee that any assessment result predicts job performance,
              hiring outcomes, or career success. The Skill-Print is a self-reported snapshot,
              not a certified credential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your account</h2>
            <p>
              You are responsible for maintaining the security of your account and for all
              activity that occurs under it. Accounts are for individual use — please don't
              share your login credentials. You must be at least 13 years old to use Skill-Print.
            </p>
            <p className="mt-3">
              You agree to provide accurate information when creating your account and completing
              assessments. The Skill-Print is only as useful as the honesty you bring to it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your Skill-Print</h2>
            <p>
              The Skill-Print you generate belongs to you. You can download it, include it on
              your resume, and share it however you like. Skill-Print does not claim ownership
              over your assessment results or the reports generated from them.
            </p>
            <p className="mt-3">
              We may use aggregated, anonymized assessment data (never personally identifiable)
              to improve the product and understand how the platform is being used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Payments and refunds</h2>
            <p>
              Paid features are billed through Stripe. The $10 one-time payment for the full
              8-domain Skill-Print is non-refundable once the assessment results are accessed,
              as the digital content is delivered immediately upon payment.
            </p>
            <p className="mt-3">
              The $10/month Pro subscription can be cancelled at any time from your account
              settings. Cancellation stops future charges; you retain access through the end
              of the current billing period. We do not provide prorated refunds for partial months.
            </p>
            <p className="mt-3">
              If you believe a charge was made in error, contact us at{' '}
              <a href="mailto:clareerhq@gmail.com" className="text-brand-700 hover:underline">
                clareerhq@gmail.com
              </a>{' '}
              and we'll sort it out.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Use Skill-Print to misrepresent your skills to employers</li>
              <li>Attempt to reverse-engineer, scrape, or systematically extract O*NET data
                  or product content</li>
              <li>Use automated tools to generate bulk assessments</li>
              <li>Resell access to Skill-Print or its outputs without written permission</li>
              <li>Use the platform in any way that violates applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Intellectual property</h2>
            <p>
              The Skill-Print name, logo, brand assets, and product design are owned
              by Skill-Print. The O*NET data powering the assessments is owned by the U.S.
              Department of Labor and used in accordance with their public data policy.
              Nothing in these terms grants you a license to use Skill-Print's brand or
              trademarks without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Disclaimer of warranties</h2>
            <p>
              Skill-Print is provided "as is" without warranties of any kind, express or implied.
              We don't guarantee the service will be uninterrupted, error-free, or that any
              particular career outcome will result from using it. Career decisions are yours
              to make — the Skill-Print is a tool to inform them, not a guarantee.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Skill-Print's liability for any claim
              arising from your use of the service is limited to the amount you paid us in
              the three months preceding the claim, or $10, whichever is greater.
              We are not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to the service or these terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated
              by email and by updating the effective date above. Continued use after changes
              are posted means you accept the updated terms.
            </p>
            <p className="mt-3">
              We reserve the right to modify, suspend, or discontinue any part of the service
              at any time, though we'll do our best to give reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Governing law</h2>
            <p>
              These terms are governed by the laws of the United States and the state in which
              Skill-Print is registered. Any disputes will be resolved in the applicable courts
              of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
            <p>
              Questions about these terms? Email us at{' '}
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
