import { SignUp } from '@clerk/react'
import { LandingShell } from '../components/landing/LandingShell'

export default function SignUpPage() {
  return (
    <LandingShell mode="signup">
      <SignUp routing="path" path="/registro" signInUrl="/login" forceRedirectUrl="/" />
    </LandingShell>
  )
}
