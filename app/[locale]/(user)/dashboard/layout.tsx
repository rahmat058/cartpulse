import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AccountShell } from '@/components/account/AccountShell'
import type { AuthMethodId } from '@/lib/auth/user-auth-methods'

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  let hasPassword = true

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, emailVerified: true, email: true },
    })
    hasPassword = Boolean(user?.passwordHash)

    if (user && !user.emailVerified) {
      redirect(`/login?verify=required&email=${encodeURIComponent(user.email)}`)
    }
  }

  return (
    <AccountShell
      hasPassword={hasPassword}
      authProvider={session?.user?.authProvider as AuthMethodId | undefined}>
      {children}
    </AccountShell>
  )
}
