'use client'

// Pure SVG chart components — no external chart libraries
// SparkLine: polyline chart for time-series data
// BarChart: vertical bar chart for categorical data

interface SparkLineProps {
  data: number[]
  labels: string[]
  width?: number
  height?: number
  color?: string
}

export function SparkLine({ data, labels, width = 400, height = 80, color = '#3b82f6' }: SparkLineProps) {
  if (!data.length) return <div className="text-xs text-slate-500 py-4 text-center">No data</div>

  const padX = 8
  const padY = 8
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const max = Math.max(...data, 1)
  const min = 0

  const pts = data.map((v, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * chartW
    const y = padY + chartH - ((v - min) / (max - min)) * chartH
    return { x, y, v, label: labels[i] ?? '' }
  })

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

  // Grid lines (3 horizontal)
  const gridLines = [0.25, 0.5, 0.75, 1].map(f => ({
    y: padY + chartH - f * chartH,
    val: Math.round(max * f),
  }))

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width, display: 'block' }}
      className="overflow-visible"
    >
      {/* Grid lines */}
      {gridLines.map(g => (
        <line
          key={g.y}
          x1={padX} y1={g.y} x2={width - padX} y2={g.y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padX},${padY + chartH} ${polyline} ${width - padX},${padY + chartH}`}
        fill={`url(#grad-${color.replace('#', '')})`}
      />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots with tooltips */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="rgba(15,23,42,0.8)" strokeWidth="1.5" />
          <title>{p.label}: {p.v}</title>
          {/* Invisible larger hit area */}
          <circle cx={p.x} cy={p.y} r="8" fill="transparent">
            <title>{p.label}: {p.v}</title>
          </circle>
        </g>
      ))}
    </svg>
  )
}

interface BarChartProps {
  data: number[]
  labels: string[]
  width?: number
  height?: number
  color?: string
}

export function BarChart({ data, labels, width = 400, height = 100, color = '#8b5cf6' }: BarChartProps) {
  if (!data.length) return <div className="text-xs text-slate-500 py-4 text-center">No data</div>

  const padX = 4
  const padY = 8
  const chartW = width - padX * 2
  const chartH = height - padY * 2
  const max = Math.max(...data, 1)
  const barW = Math.max(2, chartW / data.length - 2)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width, display: 'block' }}
      className="overflow-visible"
    >
      {data.map((v, i) => {
        const barH = ((v / max) * chartH) || 1
        const x = padX + i * (chartW / data.length) + (chartW / data.length - barW) / 2
        const y = padY + chartH - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx="2" opacity="0.85" />
            <title>{labels[i] ?? ''}: {v}</title>
          </g>
        )
      })}
    </svg>
  )
}
