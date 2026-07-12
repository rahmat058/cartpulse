import './globals.css'
import { cn } from '@/lib/utils'
import type { Metadata, Viewport } from 'next'
import { getLocale } from 'next-intl/server'
import { Roboto, Geist } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'CartPulse — E-commerce Platform',
  description: 'Next.js storefront with Prisma catalog, Redux cart, and derived pricing.',
  applicationName: 'CartPulse',
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    title: 'CartPulse',
    capable: true,
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#14b8a6' },
    { media: '(prefers-color-scheme: dark)', color: '#0f766e' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body className={`${roboto.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
