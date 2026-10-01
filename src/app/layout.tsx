import { Archivo, Cormorant_Garamond, Geist, Instrument_Serif, Inter } from 'next/font/google'
import localFont from 'next/font/local'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/auth-provider'
import { Toaster } from "@/components/ui/toast"

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: '400',
})
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
})
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  weight: ['400', '500', '600', '700'],
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

const saprona = localFont({
  src: [
    {
      path: '../../public/font/saprona/Saprona-UltraLight.ttf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/font/saprona/Saprona-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/font/saprona/Saprona-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/font/saprona/Saprona-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/font/saprona/Saprona-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-saprona',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Burn Box Operations Hub — Everything your business needs, One Dashboard',
  description:
    'Burn Box Operations Hub is a comprehensive platform for businesses to manage all their operations in one place. From managing inventory to handling customer support, Burn Box Operations Hub provides everything your business needs in one simple dashboard.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#050505',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${instrumentSerif.variable} ${cormorant.variable} ${archivo.variable} ${inter.variable} ${saprona.variable}`}>
      <body className="antialiased">
        <TooltipProvider>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
            >
            <Toaster />
            {children}
          </ThemeProvider>
        </SessionProvider>
            </TooltipProvider>
      </body>
    </html>
  )
}
