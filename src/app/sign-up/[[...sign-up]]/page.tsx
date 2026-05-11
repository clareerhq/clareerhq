import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center px-4">
      <a href="/" className="mb-8 block">
        <img src="/logo.svg" alt="Skill-Print" className="h-8 w-auto mx-auto" />
      </a>
      <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
        Create a free account to save your assessments and track your progress over time.
      </p>
      <SignUp />
    </div>
  );
}
