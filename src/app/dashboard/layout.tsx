import { Archivo, Cormorant_Garamond, Geist, Instrument_Serif, Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/auth-provider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
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
        <html lang="en" className={`${geist.variable} ${archivo.variable} font-archivo ${inter.variable}`}>
            <body className="antialiased">
                <TooltipProvider>
                    <SessionProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="dark"
                            enableSystem
                            disableTransitionOnChange
                        >
                            {children}
                        </ThemeProvider>
                    </SessionProvider>
                </TooltipProvider>
            </body>
        </html>
    )
}