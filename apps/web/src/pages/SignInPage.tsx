import { SignIn } from '@clerk/react'
import { LandingShell } from '../components/landing/LandingShell'

export default function SignInPage() {
  return (
    <LandingShell mode="signin">
      <SignIn routing="path" path="/login" signUpUrl="/registro" forceRedirectUrl="/" />
    </LandingShell>
  )
}
