import Link from 'next/link'

export default function RootNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Page not found</h1>
      <Link href="/" className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">
        Back to home
      </Link>
    </div>
  )
}
