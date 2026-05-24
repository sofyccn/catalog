import { SignIn } from '@clerk/react'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <SignIn routing="path" path="/login" signUpUrl="/registro" forceRedirectUrl="/" />
    </div>
  )
}
