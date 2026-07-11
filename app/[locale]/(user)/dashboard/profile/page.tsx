import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ProfileForm } from '@/components/dashboard/ProfileForm'
import type { AuthMethodId } from '@/lib/auth/user-auth-methods'

export default async function DashboardProfilePage() {
  const session = await auth()
  let hasPassword = true
  let image: string | null = null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, image: true },
    })
    hasPassword = Boolean(user?.passwordHash)
    image = user?.image ?? session.user.image ?? null
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Update your photo, name, and password</p>
      </div>
      <ProfileForm
        hasPassword={hasPassword}
        image={image}
        authProvider={session?.user?.authProvider as AuthMethodId | undefined}
      />
    </div>
  )
}
