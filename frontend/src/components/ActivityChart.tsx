import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { format, parseISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface Props {
  data: { date: string; count: number }[]
}

export default function ActivityChart({ data }: Props) {
  const chartData = {
    labels: data.map((d) => format(parseISO(d.date), 'EEE')),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.9)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => ` ${ctx.raw} task${ctx.raw === 1 ? '' : 's'}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.5)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          stepSize: 1,
          precision: 0,
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Tasks created (last 7 days)</h3>
      <div className="h-40">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
