'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia
} from "@/components/ui/item"
import { AlertCircleIcon, CircleCheckIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

function LeftPanel() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const logoSrc = !mounted ? '/hlogo-dark.svg' : (currentTheme === 'dark' ? '/hlogo-dark.svg' : '/hlogo-light.svg')

  return (
    <div className="relative hidden lg:flex flex-col items-center text-center justify-between w-1/2 min-h-screen bg-[#F2F1EC] overflow-hidden px-14 py-12 select-none">
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
        <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 font-medium mb-6">
          Operations Hub
        </p>

        <h2
          className="text-[2.5rem] font-semibold leading-[1.12] tracking-[-0.035em] text-black"
          style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
        >
          Join the <em className="text-[#668E2B] italic font-normal">team</em>
        </h2>

        <p className="mt-6 text-black/60 text-sm leading-[1.75] max-w-88">
          Request access to start managing inventory, tracking sales, and keeping operations running smoothly.
        </p>

        {/* Three quiet lines — no icons, just text */}
        <div className="mt-6 flex flex-col gap-3.5">
          {[
            'Streamline your daily operations',
            'Access real-time inventory data',
            'Connect with the Burn Box ecosystem',
          ].map(line => (
            <div key={line} className="flex items-start justify-center gap-3">
              <span className="mt-1.75 size-1 rounded-full bg-black/60 shrink-0" />
              <span className="text-[13px] text-black/60 leading-snug">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — version tag */}
      <div className="relative z-10">
        <p className="text-[11px] text-[#4a5e42] tracking-wide">
          v1.0 — Built for Burn Box
        </p>
      </div>
    </div>
  )
}

export default function Page() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [reasonError, setReasonError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNameError('')
    setEmailError('')
    setRoleError('')
    setReasonError('')

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const role = formData.get('role') as string
    const reason = formData.get('reason') as string

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!name || name.trim().length < 2) {
      setNameError('Please enter your full name')
      return
    }

    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    if (!role) {
      setRoleError('Please select your role')
      return
    }

    if (!reason || reason.trim().length < 10) {
      setReasonError('Please provide a reason for requesting access (min 10 characters)')
      return
    }

    try {
      const response = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, reason }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit request. Please try again.')
      }
    } catch (error) {
      console.error('Request access error:', error)
      setError('An error occurred. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'var(--font-inter)' }}>

      {/* LEFT */}
      <LeftPanel />

      {/* RIGHT */}
      <div className="relative flex flex-col items-center justify-center w-full lg:w-1/2 min-h-screen bg-black px-4 sm:px-6 py-10 sm:py-14 overflow-hidden">

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

          {!submitted ? (
            <>
              {/* Heading */}
              <h1
                className="text-[1.5rem] sm:text-[1.75rem] font-bold text-center text-white leading-tight mb-2"
                style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
              >
                Request <em className="text-[#9DBD61]">access</em>
              </h1>

              <p className="text-sm text-center text-[#A9AAA0] mb-6 sm:mb-8">
                Fill in your details to request access to the Burn Box Operations Hub.
              </p>

              {/* Card */}
              <div className="w-full rounded-2xl border border-[#3a3a3a] bg-[#1a1a1a]/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-[#31412B]/10">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  {error && (
                    <Item variant="outline" className="border-rose-500/50 bg-rose-950/20">
                      <ItemMedia variant="icon">
                        <HugeiconsIcon icon={AlertCircleIcon} className="size-5 text-rose-600" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription className="text-rose-600">
                          {error}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  )}

                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-white">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="John Doe"
                      className={`rounded-md bg-transparent dark:text-black text-white dark:border-neutral-300 border-neutral-800 ${nameError
                          ? 'bg-rose-50 border-rose-300 dark:bg-[#feedf4] dark:border-[#fabed0] focus:ring-rose-500/20'
                          : ''
                        }`}
                    />
                    {nameError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{nameError}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-white">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      className={`rounded-md bg-transparent dark:text-black text-white dark:border-neutral-300 border-neutral-800 ${emailError
                          ? 'bg-rose-50 border-rose-300 dark:bg-[#feedf4] dark:border-[#fabed0] focus:ring-rose-500/20'
                          : ''
                        }`}
                    />
                    {emailError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{emailError}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="role" className="text-sm font-medium text-white">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      className={`rounded-md bg-transparent dark:text-black text-white dark:border-neutral-300 border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#668E2B]/20 ${roleError
                          ? 'bg-rose-50 border-rose-300 dark:bg-[#feedf4] dark:border-[#fabed0] focus:ring-rose-500/20'
                          : ''
                        }`}
                    >
                      <option value="" className="bg-[#1a1a1a] text-white">
                        Select your role
                      </option>
                      <option value="FRONT_DESK" className="bg-[#1a1a1a] text-white">
                        Front Desk
                      </option>
                      <option value="INVENTORY" className="bg-[#1a1a1a] text-white">
                        Inventory Manager
                      </option>
                      <option value="CUSTOMER" className="bg-[#1a1a1a] text-white">
                        Customer
                      </option>
                    </select>
                    {roleError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{roleError}</p>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reason" className="text-sm font-medium text-white">
                      Reason for Access
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      required
                      rows={3}
                      placeholder="Please explain why you need access to the Operations Hub..."
                      className={`rounded-md bg-transparent dark:text-black text-white dark:border-neutral-300 border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#668E2B]/20 resize-none ${reasonError
                          ? 'bg-rose-50 border-rose-300 dark:bg-[#feedf4] dark:border-[#fabed0] focus:ring-rose-500/20'
                          : ''
                        }`}
                    />
                    {reasonError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{reasonError}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="mt-1 h-11 w-full rounded-xl bg-[#9DBD61] text-sm font-semibold text-[#0a0f07] transition hover:bg-[#b5d475] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#668E2B] dark:bg-[#182015] dark:text-white dark:hover:bg-[#293126] flex items-center justify-center gap-2"
                  >
                    Submit Request
                  </button>
                </form>
              </div>

              {/* Sign in */}
              <p className="mt-6 text-sm text-[#888] dark:text-[#5F675C] text-center">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-[#9DBD61] hover:text-[#b5d475] dark:text-[#526F1F] dark:hover:text-[#668E2B] font-medium transition"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="w-full rounded-2xl border border-[#3a3a3a] bg-[#1a1a1a]/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-[#31412B]/10 dark:border-[#D8DDD1] dark:bg-white/80 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#9DBD61]/20 dark:bg-[#668E2B]/20 flex items-center justify-center">
                    <HugeiconsIcon icon={CircleCheckIcon} className="size-8 text-[#9DBD61] dark:text-[#668E2B]" />
                  </div>
                </div>

                <h2
                  className="text-[1.5rem] font-bold text-white leading-tight mb-2"
                  style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
                >
                  Request <em className="text-[#9DBD61] dark:text-[#668E2B]">submitted</em>
                </h2>

                <p className="text-sm text-[#A9AAA0] dark:text-[#5F675C] mb-6">
                  Thank you for your interest in joining the Burn Box Operations Hub. Your request has been submitted and will be reviewed by our team.
                </p>

                <p className="text-xs text-[#888] dark:text-[#7A8275] mb-6">
                  We'll get back to you within 1-2 business days with further instructions.
                </p>

                <Link
                  href="/auth/login"
                >
                  <Button>
                  Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}