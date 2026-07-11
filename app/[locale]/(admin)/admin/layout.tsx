import { AdminLayoutShell } from '@/components/layout/AdminLayout'

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
