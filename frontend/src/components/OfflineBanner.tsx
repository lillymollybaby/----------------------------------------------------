export default function OfflineBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-sm text-amber-400">
      <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      You're offline — changes will sync when connection restores
    </div>
  )
}
