import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center px-4">
      <a href="/" className="text-2xl font-bold text-brand-700 mb-8 block">
        Clareer<span className="text-accent-600">HQ</span>
      </a>
      <SignIn />
    </div>
  );
}
