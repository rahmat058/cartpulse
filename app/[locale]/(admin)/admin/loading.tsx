export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading admin page">
      <div className="space-y-2">
        <div className="bg-muted h-7 w-48 rounded-md" />
        <div className="bg-muted/70 h-4 w-72 max-w-full rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border-border bg-card h-24 rounded-md border" />
        ))}
      </div>
      <div className="border-border bg-card h-64 rounded-md border" />
      <div className="border-border bg-card h-48 rounded-md border" />
    </div>
  )
}
