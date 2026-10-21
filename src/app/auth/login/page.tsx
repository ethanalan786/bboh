'use client'

import { Input } from '@/components/ui/input'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia
} from "@/components/ui/item"
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { signIn } from 'next-auth/react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function LeftPanel() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const logoSrc = !mounted ? '/hlogo-dark.svg' : (currentTheme === 'dark' ? '/hlogo-dark.svg' : '/hlogo-light.svg')

  return (
    <div className="relative hidden lg:flex flex-col items-center text-center justify-between w-1/2 min-h-screen bg-[#F2F1EC] dark:bg-black overflow-hidden px-14 py-12 select-none">
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
        <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 font-medium mb-6">
          Operations Hub
        </p>

        <h2
          className="text-[2.5rem] font-semibold leading-[1.12] tracking-[-0.035em] text-black dark:text-white"
          style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
        >
          Every detail,<br />
          <em className="text-[#668E2B] dark:text-[#7aaa40] italic font-normal">always in order.</em>
        </h2>

        <p className="mt-6 text-black/60 dark:text-white/60 text-sm leading-[1.75] max-w-88">
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
              <span className="mt-[7px] size-1 rounded-full bg-black/60 dark:bg-white/60 shrink-0" />
              <span className="text-[13px] text-black/60 dark:text-white/60 leading-snug">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — version tag */}
      <div className="relative z-10">
        <p className="text-[11px] text-[#4a5e42] dark:text-[#283d22] tracking-wide">
          v1.0 — Built for Burn Box
        </p>
      </div>
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const passwordRef = useRef<HTMLInputElement>(null)



  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setEmailError('')
    setPasswordError('')
    setSubmitted(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      setSubmitted(false)
      return
    }

    if (!password) {
      // If email is valid but password is empty, just focus password field without error
      if (email && passwordRef.current) {
        passwordRef.current.focus()
        setSubmitted(false)
        return
      }
      setPasswordError('Please enter your password')
      setSubmitted(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        setError('Incorrect email or password')
        setSubmitted(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
      setSubmitted(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* LEFT */}
      <LeftPanel />

      {/* RIGHT */}
      <div className="relative flex flex-col items-center justify-center w-full lg:w-1/2 min-h-screen bg-black dark:bg-[#F7F8F2] px-4 sm:px-6 py-10 sm:py-14 overflow-hidden">

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

          {/* Heading */}
          <h1
            className="text-[1.5rem] sm:text-[1.75rem] font-bold text-center text-white dark:text-[#182015] leading-tight mb-2"
            style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
          >
            Let&apos;s get back to <em className="text-[#9DBD61] dark:text-[#668E2B]">work</em>
          </h1>

          <p className="text-sm text-center text-[#A9AAA0] dark:text-[#5F675C] mb-6 sm:mb-8">
            Sign in to pick up where you left off.
          </p>

          {/* Card */}
          <div className="w-full rounded-2xl border border-[#3a3a3a] bg-[#1a1a1a]/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-[#31412B]/10 dark:border-[#D8DDD1] dark:bg-white/80">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {error && (
                <Item variant="outline" className="border-rose-500/50 dark:bg-rose-50 bg-rose-950/20">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-5 text-rose-600" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription className="text-rose-600 dark:text-rose-400">
                      {error}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-white dark:text-[#182015]">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Your Work Email"
                  className={`rounded-md bg-transparent dark:text-black text-white dark:border-neutral-300 border-neutral-800 ${emailError
                      ? 'bg-rose-50 border-rose-300 dark:bg-[#feedf4] dark:border-[#fabed0] focus:ring-rose-500/20'
                      : ''
                    }`}
                />
                {emailError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-white dark:text-[#182015]">
                    Password
                  </label>
                  <Link href="/auth/passwordreset">
                    <button
                      type="button"
                      className="text-sm text-[#A2A03E] hover:text-[#C5CB68] dark:text-[#526F1F] dark:hover:text-[#668E2B] transition"
                    >
                      Forgot Password?
                    </button>
                  </Link>

                </div>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    className={`rounded-md bg-transparent pr-10 dark:text-black text-white border dark:border-neutral-300 border-neutral-800 ${passwordError
                        ? 'bg-rose-50 border-rose-300 dark:bg-[#feedf4] dark:border-[#fabed0] focus:ring-rose-500/20'
                        : ''
                      }`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#F3F4D4] dark:text-[#7A8275] dark:hover:text-[#293126] transition"
                  >
                    {showPassword
                      ? <HugeiconsIcon icon={EyeOffIcon} className="size-5" />
                      : <HugeiconsIcon icon={EyeIcon} className="size-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{passwordError}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitted}
                className="mt-1 h-11 w-full rounded-xl bg-[#9DBD61] text-sm font-semibold text-[#0a0f07] transition hover:bg-[#b5d475] disabled:opacity-80 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#668E2B] dark:bg-[#182015] dark:text-white dark:hover:bg-[#293126] flex items-center justify-center gap-2"
              >
                {submitted ? (
                  <>
                    <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </form>

            {/* Google */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              aria-label="Continue with Google"
              className="mt-4 flex h-14 w-full items-center gap-3 rounded-xl border border-[#3a3a3a] dark:border-[#D8DDD1] bg-[#1a1a1a] dark:bg-[#F7F8F2] px-4 transition hover:border-[#668E2B]/30 hover:bg-[#2a2a2a] dark:hover:border-[#668E2B]/50 dark:hover:bg-[#EEF2E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A2A03E]"
            >
              <GoogleIcon />
              <span className="text-sm font-semibold text-white dark:text-[#182015]">Continue with Google</span>
            </button>
          </div>

          {/* Sign up */}
          <p className="mt-6 text-sm text-[#888] dark:text-[#5F675C] text-center">
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              className="text-[#9DBD61] hover:text-[#b5d475] dark:text-[#526F1F] dark:hover:text-[#668E2B] font-medium transition"
            >
              Request access
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}