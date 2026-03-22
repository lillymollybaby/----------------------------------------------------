interface Props {
  onInstall: () => void
}

export default function InstallPrompt({ onInstall }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 bg-primary-600/10 border-b border-primary-500/20 px-4 py-2">
      <p className="text-sm text-primary-300">Install FlowTask for the best experience</p>
      <button onClick={onInstall} className="btn-primary text-xs py-1.5 shrink-0">
        Install
      </button>
    </div>
  )
}
