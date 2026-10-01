'use client'

import { ArrowLeft, ArrowRight, ChevronDown, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Header bar - mobile only */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none">
              <path
                d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M3 7l9 5 9-5M12 12v10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Burn Box</p>
            <p className="text-white/40 text-xs leading-tight">Operations Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-semibold">
            JD
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-sm font-medium leading-tight">John Doe</p>
            <p className="text-white/40 text-xs leading-tight">Front Desk</p>
          </div>
          <ChevronDown className="w-4 h-4 text-white/50" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-start px-6 md:px-16 lg:px-24 py-10 md:py-0 text-center md:text-left relative">
        <div className="w-full md:max-w-2xl flex flex-col items-center md:items-start order-2 md:order-1">
          {/* Status pill */}
          <div className="flex items-center gap-2 mb-4 md:mb-3">
            <span className="w-2 h-2 rounded-full bg-[#c8f135] shadow-[0_0_8px_rgba(200,241,53,0.8)]" />
            <span className="text-white/50 text-sm tracking-wide">
              404 <span className="mx-1 text-white/30">|</span> Page Not Found
            </span>
          </div>

          {/* 404 headline */}
          <h1 className="text-white font-bold leading-none tracking-tight text-[120px] sm:text-[150px] md:text-[180px] mb-4 md:mb-3">
            404
          </h1>

          {/* Message */}
          <p className="text-2xl sm:text-3xl md:text-3xl text-white/90 font-semibold mb-3 leading-snug max-w-md md:max-w-none">
            Oops! The page you&apos;re looking for{' '}
            <span className="text-[#c8f135]">doesn&apos;t exist.</span>
          </p>
          <p className="text-base text-white/50 mb-8 leading-relaxed max-w-sm md:max-w-md">
            It might have been moved, deleted, or maybe you entered the wrong address.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-xs md:max-w-none md:w-auto">
            <Button
              onClick={() => router.push('/dashboard/front-desk-role')}
              className="w-full md:w-auto bg-[#c8f135] text-black hover:bg-[#c8f135]/90 font-semibold px-6 py-6 rounded-full flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(200,241,53,0.35)] md:shadow-none"
            >
              <Home className="w-5 h-5" fill="black" />
              Go to Dashboard
              <ArrowRight className="w-4 h-4 md:hidden" />
            </Button>
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="lg"            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative mb-6 md:mb-0 order-1 md:order-2 md:flex-1 md:flex md:justify-end">
          <Image
            src="/404/404-sadbox.png"
            alt="Sad box illustration"
            width={900}
            height={900}
            className="w-[260px] sm:w-[320px] md:w-[750px] h-auto"
            priority
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-16 lg:px-24 pb-8 md:pb-10 flex justify-center md:justify-start relative">
        <div className="flex items-center gap-2">
          <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
            {[0, 10, 20, 30].map((x, i) => (
              <line
                key={i}
                x1={x}
                y1={14 - i * 1.5}
                x2={x + 7}
                y2={2 - i * 1.5}
                stroke="#c8f135"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </svg>
          <p className="text-white/30 text-xs tracking-[0.2em] font-medium">
            STOCK / SALES / GROWTH
          </p>
        </div>
      </footer>
    </div>
  )
}