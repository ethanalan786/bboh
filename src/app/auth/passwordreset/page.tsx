'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCwIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

function LeftPanel() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const logoSrc = !mounted ? '/hlogo-dark.svg' : (currentTheme === 'dark' ? '/hlogo-dark.svg' : '/hlogo-light.svg')

  return (
    <div className="relative hidden lg:flex flex-col items-center text-center justify-between w-1/2 min-h-screen dark:bg-black overflow-hidden px-14 py-12 select-none">
      {/* Logo */}
      <Link href="/" className="">
        <Image
          src={logoSrc}
          alt="Burn Box Logo"
          width={200}
          height={200}
          className="object-contain"
        />
      </Link>

      {/* Central copy — minimal, typographic */}
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] dark:text-white/40 font-medium mb-6">
          Operations Hub
        </p>

        <h2
          className="text-[2.5rem] font-semibold leading-[1.12] tracking-[-0.035em] dark:text-white"
          style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
        >
          Every detail,<br />
          <em className="dark:text-[#7aaa40] italic font-normal">always in order.</em>
        </h2>

        <p className="mt-6 dark:text-white/60 text-sm leading-[1.75] max-w-88">
          Inventory, recipes, purchasing, and sales — unified across Box Apparel and Burn Box so nothing slips through.
        </p>

        {/* Three quiet lines — no icons, just text */}
        <div className="mt-6 flex flex-col gap-3.5">
          {[
            'Real-time stock across all product lines',
            'Automatic ingredient deduction on every sale',
            'GymMaster & QuickBooks always in sync',
          ].map(line => (
            <div key={line} className="flex items-start justify-center gap-3">
              <span className="mt-1.75 size-1 rounded-full dark:bg-white/60 shrink-0" />
              <span className="text-[13px] dark:text-white/60 leading-snug">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — version tag */}
      <div className="relative z-10">
        <p className="text-[11px] dark:text-[#283d22] tracking-wide">
          v1.0 — Built for Burn Box
        </p>
      </div>
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<'email' | 'otp' | 'newpassword'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [otpInvalid, setOtpInvalid] = useState(false)
  const [otpValid, setOtpValid] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted && currentTheme === 'dark'

  async function handleSendOTP(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setEmailError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const emailValue = formData.get('email') as string

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailValue || !emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/otp-send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmail(emailValue)
        setStep('otp')
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setOtpError(false)
    setOtpInvalid(false)
    setOtpValid(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/otp-send-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpValid(true)
        // Show valid state briefly before moving to password step
        setTimeout(() => {
          setStep('newpassword')
          setOtpValid(false)
        }, 1000)
      } else {
        setOtpError(true)
        setOtpInvalid(true)
        setError(data.error || 'Invalid OTP')
        // Reset invalid state after animation
        setTimeout(() => setOtpInvalid(false), 500)
      }
    } catch {
      setOtpError(true)
      setOtpInvalid(true)
      setError('An error occurred. Please try again.')
      // Reset invalid state after animation
      setTimeout(() => setOtpInvalid(false), 500)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPasswordError('')
    setLoading(true)

    // Client-side validation
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        // Password updated successfully, redirect to login
        router.push('/auth/login')
      } else {
        setError(data.error || 'Failed to update password')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOTP() {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/otp-send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to resend OTP')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleBackToEmail() {
    setStep('email')
    setOtp('')
    setOtpError(false)
    setOtpInvalid(false)
    setOtpValid(false)
    setError('')
  }

  function handleBackToOTP() {
    setStep('otp')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setError('')
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* LEFT */}
      <LeftPanel />

      {/* RIGHT */}
      <div className="relative flex flex-col items-center justify-center w-full lg:w-1/2 min-h-screen dark:bg-[#F7F8F2] px-4 sm:px-6 py-10 sm:py-14 overflow-hidden">

        {/* Soft radial glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div style={{
            position: 'absolute', left: '50%', top: '45%',
            width: '70%', height: '60%',
            background: 'radial-gradient(ellipse at center, #C5D99A 0%, #9DBD61 28%, transparent 70%)',
            filter: 'blur(130px)', opacity: 0.22,
            transform: 'translate(-50%, -50%)',
          }} className="dark:opacity-15" />
          <div style={{
            position: 'absolute', left: '62%', top: '62%',
            width: '50%', height: '45%',
            background: 'radial-gradient(ellipse at center, #9BC8C6 0%, #6FA9A5 32%, transparent 70%)',
            filter: 'blur(110px)', opacity: 0.18,
            transform: 'translate(-50%, -50%)',
          }} className="dark:opacity-10" />
        </div>

        <div className="relative z-10 w-full max-w-sm">

          {step === 'email' ? (
            <Card className="w-full border shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-4" onSubmit={handleSendOTP}>
                  {error && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="size-4 shrink-0 text-destructive" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      className={emailError ? "focus:border-destructive" : ""}
                    />
                    {emailError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin size-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Sending...
                      </>
                    ) : 'Send verification code'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-center w-full text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>
          ) : step === 'otp' ? (
                       <>
              {/* OTP Verification Card */}
              <Card className="mx-auto max-w-md w-full border shadow-lg">
                <CardHeader>
                  <CardTitle>Verify your email</CardTitle>
                  <CardDescription>
                    Enter the verification code we sent to your email address:{" "}
                    <span className="font-medium">{email}</span>.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVerifyOTP}>
                    {error && (
                      <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="size-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="otp-verification">
                          Verification code
                        </FieldLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleResendOTP}
                          disabled={loading}
                        >
                          <RefreshCwIcon className={loading ? "animate-spin" : ""} />
                          Resend Code
                        </Button>
                      </div>
                      <InputOTP
                        maxLength={6}
                        id="otp-verification"
                        value={otp}
                        onChange={setOtp}
                        containerClassName="w-full justify-between"
                      >
                        <InputOTPGroup className="gap-1 sm:gap-2 *:data-[slot=input-otp-slot]:h-10 sm:*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-[15%] sm:*:data-[slot=input-otp-slot]:w-[15%] *:data-[slot=input-otp-slot]:text-lg sm:*:data-[slot=input-otp-slot]:text-xl">
                          <InputOTPSlot index={0} aria-invalid={otpInvalid} data-valid={otpValid} />
                          <InputOTPSlot index={1} aria-invalid={otpInvalid} data-valid={otpValid} />
                          <InputOTPSlot index={2} aria-invalid={otpInvalid} data-valid={otpValid} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup className="gap-1 sm:gap-2 *:data-[slot=input-otp-slot]:h-10 sm:*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-[15%] sm:*:data-[slot=input-otp-slot]:w-[15%] *:data-[slot=input-otp-slot]:text-lg sm:*:data-[slot=input-otp-slot]:text-xl">
                          <InputOTPSlot index={3} aria-invalid={otpInvalid} data-valid={otpValid} />
                          <InputOTPSlot index={4} aria-invalid={otpInvalid} data-valid={otpValid} />
                          <InputOTPSlot index={5} aria-invalid={otpInvalid} data-valid={otpValid} />
                        </InputOTPGroup>
                      </InputOTP>
                      <FieldDescription>
                        <button
                          type="button"
                          onClick={handleBackToEmail}
                          className="underline underline-offset-4 hover:text-primary transition-colors text-[15px]"
                        >
                          I no longer have access to this email address.
                        </button>
                        <hr className='text-neutral-800 w-full h-full mt-5' />
                      </FieldDescription>
                    </Field>

                    <CardFooter className="px-0 pt-6">
                      <Field>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-[330] rounded-[10px]"
                        >
                          {loading ? (
                            <> 
                              <svg className="animate-spin size-4 mr-2 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                              </svg>
                              Verifying...
                            </>
                          ) : 'Verify'}
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          Having trouble signing in?{" "}
                          <Link
                            href="/contact"
                            className="underline underline-offset-4 transition-colors hover:text-primary"
                          >
                            Contact support
                          </Link>
                        </div>
                      </Field>
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* New Password Card */}
              <Card className="mx-auto max-w-md w-full border shadow-lg">
                <CardHeader>
                  <CardTitle>Set new password</CardTitle>
                  <CardDescription>
                    Create a new password for your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword}>
                    {error && (
                      <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="size-4 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="new-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          New Password
                        </label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={passwordError ? "focus:border-destructive" : ""}
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                          >
                            {showPassword
                              ? <EyeOffIcon className="size-4" />
                              : <EyeIcon className="size-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="confirm-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={passwordError ? "focus:border-destructive" : ""}
                          />
                          <button
                            type="button"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowConfirmPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                          >
                            {showConfirmPassword
                              ? <EyeOffIcon className="size-4" />
                              : <EyeIcon className="size-4" />}
                          </button>
                        </div>
                        {passwordError && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            {passwordError}
                          </p>
                        )}
                      </div>
                    </div>

                    <CardFooter className="px-0 pt-6 flex flex-col gap-3">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-[10px]"
                      >
                        {loading ? (
                          <> 
                            <svg className="animate-spin size-4 mr-2 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Updating...
                          </>
                        ) : 'Update Password'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToOTP}
                        className="w-full rounded-[10px]"
                      >
                        Back
                      </Button>
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}