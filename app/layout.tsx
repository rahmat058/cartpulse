import './globals.css'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
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
