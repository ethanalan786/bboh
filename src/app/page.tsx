  'use client'

import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="min-h-svh overflow-hidden bg-background">
        <section
          className="relative isolate flex min-h-svh flex-col items-center justify-center px-4 sm:px-5 sm:pt-24"
          aria-labelledby="hero-title"
        >
          <div className="flex max-w-5xl flex-col items-center text-center">
            <h1
              id="hero-title"
              className="font-serif text-[clamp(1.75rem,8vw,4rem)] font-medium leading-[0.95] tracking-[-0.065em] text-foreground text-balance sm:leading-[0.92]"
            >
              Everything Your <em className="font-normal italic">business</em> Needs, One Dashboard
            </h1>
            <p className="font-archivo mt-6 sm:mt-8 mb-6 sm:mb-8 max-w-md text-xs sm:text-sm leading-relaxed text-foreground/60">
              From stock tracking to QuickBooks sync — built for Burn Box, built for control.
            </p>
            <a
              className="font-archivo inline-flex min-h-12 min-w-32 items-center justify-center rounded-full border border-background/10 bg-foreground px-6 text-xs font-medium text-background shadow-[0_8px_22px_rgb(243_244_212/0.12)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgb(243_244_212/0.2)] focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 sm:min-h-10 sm:min-w-28 sm:px-4"
              href="/auth/login"
            >
              Sign In
            </a>
          </div>

          <ThemeToggle />

          <div className="relative mt-6 sm:mt-9 w-[min(100%,880px)]" id="preview">
            <div
              className="pointer-events-none absolute -top-[22%] left-1/2 z-[-1] h-[112%] w-[150%] -translate-x-1/2 opacity-50 dark:opacity-70 [mask-image:radial-gradient(ellipse_74%_104%_at_50%_100%,#000_0%,#000_62%,rgb(0_0_0_/_0.84)_72%,rgb(0_0_0_/_0.56)_81%,rgb(0_0_0_/_0.26)_89%,rgb(0_0_0_/_0.08)_94%,transparent_98%),linear-gradient(to_bottom,#000_0%,#000_40%,rgb(0_0_0_/_0.95)_48%,rgb(0_0_0_/_0.82)_58%,rgb(0_0_0_/_0.65)_68%,rgb(0_0_0_/_0.48)_77%,rgb(0_0_0_/_0.32)_84%,rgb(0_0_0_/_0.18)_90%,rgb(0_0_0_/_0.08)_95%,transparent_100%)] [mask-composite:intersect]"
              aria-hidden="true"
            >
              <div className="absolute -inset-1 blur-[82px] [background-blend-mode:normal,screen] [background-image:linear-gradient(96deg,#2B7B8F_0%,#3a8a9e_13%,#4a99ad_25%,#668E2B_36%,#5a7d28_45%,#4e6c25_54%,#425c22_64%,#5a6d29_75%,#727e30_85%,#8a8f37_93%,#a2a03e_100%),radial-gradient(50%_68%_at_49%_48%,rgb(100_180_150_/_0.1),rgb(150_200_100_/_0.22)_54%,transparent_88%)] dark:[background-image:linear-gradient(96deg,#1a5a6a_0%,#2a6a7a_13%,#3a7a8a_25%,#4a6a1f_36%,#3d5a18_45%,#304a11_54%,#233a0a_64%,#304a11_75%,#3d5a18_85%,#4a6a1f_93%,#577a26_100%),radial-gradient(50%_68%_at_49%_48%,rgb(50_160_130_/_0.2),rgb(100_180_150_/_0.3)_54%,transparent_88%)]" />
            </div>
            <div className="relative aspect-[1.76] sm:aspect-[1.76] overflow-hidden rounded-t-[18px] border border-foreground/20 bg-[#0d0e0d] shadow-[0_0_0_7px_rgb(243_244_212_/_0.045),0_-4px_30px_rgb(243_244_212_/_0.08)]">
              <div className="absolute left-3 top-2 z-10 flex h-2.5 items-center gap-1" aria-hidden="true">
                <span className="size-1 rounded-full bg-foreground/30" />
                <span className="size-1 rounded-full bg-foreground/30" />
                <span className="size-1 rounded-full bg-foreground/30" />
              </div>
              <div className="flex items-center justify-center h-full text-white/70 text-xs sm:text-sm">
                <p className="text-center px-4">Dashboard preview image will be placed here after the SaaS dashboard is built</p>
              </div>
            </div>
          </div>
        </section>
      </main>
  )
}
