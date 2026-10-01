'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordStep1() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the functional password reset page
    router.replace('/auth/passwordreset')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to password reset...</p>
    </div>
  )
}
