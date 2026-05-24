import { SignUp } from '@clerk/react'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <SignUp routing="path" path="/registro" signInUrl="/login" forceRedirectUrl="/" />
    </div>
  )
}
