import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center px-4">
      <a href="/" className="mb-8 block">
        <img src="/logo.svg" alt="ClareerHQ" className="h-8 w-auto mx-auto" />
      </a>
      <SignIn />
    </div>
  );
}
