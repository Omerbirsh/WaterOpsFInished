import { useEffect, useRef, useState } from "react"
import { isOutOfRange } from "../lib/findings"
import { formatShortDate, formatValue } from "../lib/format"
import type { MeasurementRecord } from "../types"

interface TrendPoint {
  date: string
  measurement?: MeasurementRecord
}

export function ParameterTrend({ points }: { points: TrendPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [measuredWidth, setMeasuredWidth] = useState(720)
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      setMeasuredWidth(Math.max(300, Math.round(entry.contentRect.width)))
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (!points.length) return null

  const width = measuredWidth
  const height = 244
  const compact = width < 500
  const margin = { top: 24, right: compact ? 14 : 28, bottom: 42, left: compact ? 28 : 48 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const documentedPoints = points.flatMap(({ measurement }) => measurement ? [measurement] : [])
  if (!documentedPoints.length) return null
  const values = documentedPoints.flatMap((measurement) => [measurement.value, measurement.minimum, measurement.maximum])
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const padding = Math.max((rawMax - rawMin) * 0.16, 0.4)
  const minimum = rawMin - padding
  const maximum = rawMax + padding
  const x = (index: number) => margin.left + (index / Math.max(points.length - 1, 1)) * plotWidth
  const y = (value: number) => margin.top + ((maximum - value) / (maximum - minimum)) * plotHeight
  const configuredMinimum = documentedPoints[0].minimum
  const configuredMaximum = documentedPoints[0].maximum
  const parameter = documentedPoints[0]
  const missingCount = points.length - documentedPoints.length
  const segments: Array<Array<{ index: number; measurement: MeasurementRecord }>> = []
  let currentSegment: Array<{ index: number; measurement: MeasurementRecord }> = []
  points.forEach(({ measurement }, index) => {
    if (measurement) {
      currentSegment.push({ index, measurement })
      return
    }
    if (currentSegment.length) segments.push(currentSegment)
    currentSegment = []
  })
  if (currentSegment.length) segments.push(currentSegment)

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 sm:p-5">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="trend-title trend-description"
        className="h-[244px] w-full"
      >
        <title id="trend-title">{parameter.parameterName} history across {points.length} scheduled visits</title>
        <desc id="trend-description">
          Line chart showing measured values against the configured range of {formatValue(configuredMinimum)} to {formatValue(configuredMaximum)} {parameter.unit}.{missingCount ? ` ${missingCount} scheduled measurement was not recorded.` : ""}
        </desc>
        {[0, 0.5, 1].map((ratio) => {
          const lineY = margin.top + ratio * plotHeight
          return <line key={ratio} x1={margin.left} y1={lineY} x2={width - margin.right} y2={lineY} stroke="#e2e8f0" strokeDasharray="4 6" />
        })}
        <rect
          x={margin.left}
          y={y(configuredMaximum)}
          width={plotWidth}
          height={Math.max(y(configuredMinimum) - y(configuredMaximum), 1)}
          rx="8"
          fill="#dff7f5"
        />
        <line x1={margin.left} y1={y(configuredMaximum)} x2={width - margin.right} y2={y(configuredMaximum)} stroke="#5eead4" strokeDasharray="5 5" />
        <line x1={margin.left} y1={y(configuredMinimum)} x2={width - margin.right} y2={y(configuredMinimum)} stroke="#5eead4" strokeDasharray="5 5" />
        {segments.map((segment, segmentIndex) => (
          <polyline key={segmentIndex} points={segment.map(({ index, measurement }) => `${x(index)},${y(measurement.value)}`).join(" ")} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {points.map(({ date, measurement }, index) => {
          if (!measurement) {
            const middleY = y((configuredMinimum + configuredMaximum) / 2)
            return (
              <g key={`missing-${date}`}>
                <line x1={x(index)} y1={y(configuredMaximum)} x2={x(index)} y2={y(configuredMinimum)} stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx={x(index)} cy={middleY} r="6" fill="white" stroke="#64748b" strokeWidth="2" strokeDasharray="2 2" />
                <text x={x(index)} y={middleY - 13} textAnchor="middle" fill="#475569" fontSize={compact ? "8" : "10"} fontWeight="700">Not recorded</text>
                <text x={x(index)} y={height - 14} textAnchor="middle" fill="#475569" fontSize={compact ? "9" : "11"} fontWeight="600">{formatShortDate(date)}</text>
              </g>
            )
          }
          const outside = isOutOfRange(measurement)
          return (
            <g key={measurement.id}>
              <circle cx={x(index)} cy={y(measurement.value)} r={outside ? 7 : 6} fill={outside ? "#d97706" : "#0f766e"} stroke="white" strokeWidth="3" />
              <text x={x(index)} y={y(measurement.value) - 13} textAnchor="middle" fill="#334155" fontSize="11" fontWeight="700">
                {formatValue(measurement.value)}
              </text>
              <text x={x(index)} y={height - 14} textAnchor="middle" fill="#475569" fontSize={compact ? "9" : "11"} fontWeight="600">
                {formatShortDate(date)}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-teal-700" aria-hidden="true" />In range</span>
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-600 ring-2 ring-amber-100" aria-hidden="true" />Out of range</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-5 rounded-sm bg-teal-100" aria-hidden="true" />Configured range</span>
        {missingCount ? <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full border-2 border-dashed border-slate-500 bg-white" aria-hidden="true" />Not recorded</span> : null}
      </div>
    </div>
  )
}
