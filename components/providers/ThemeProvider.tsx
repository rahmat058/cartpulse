'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // next-themes injects an inline script to prevent theme flash. React 19 warns if
  // that script is rendered again on the client (e.g. when the locale layout remounts).
  const scriptProps =
    typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const)

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
    >
      {children}
    </NextThemesProvider>
  )
}
