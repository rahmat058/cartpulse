import { StorefrontShell } from '@/components/layout/StorefrontShell'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg flex min-h-screen flex-col">
      <StorefrontShell>{children}</StorefrontShell>
    </div>
  )
}
