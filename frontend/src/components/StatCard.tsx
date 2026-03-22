interface Props {
  label: string
  value: number
  icon: string
  color: string
  description?: string
}

export default function StatCard({ label, value, icon, color, description }: Props) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {description && <p className="text-xs text-slate-600 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}
