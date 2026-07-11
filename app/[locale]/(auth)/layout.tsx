export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg flex min-h-dvh flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        {children}
      </div>
    </div>
  )
}
