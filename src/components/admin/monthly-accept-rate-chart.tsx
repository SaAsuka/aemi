"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts"
import { AXIS_TICK, ChartTooltip, GRID_STROKE } from "@/components/admin/chart-parts"

type DataPoint = {
  label: string
  合格率: number
}

export function MonthlyAcceptRateChart({ data }: { data: DataPoint[] }) {
  const lastIndex = data.length - 1

  return (
    // relative：読み上げ用の表（sr-only）がページ全体を伸ばさないよう、この枠の中に留める
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 20, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="label" height={24} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            unit="%"
          />
          <Tooltip
            cursor={{ stroke: "#d4d4d4", strokeWidth: 1 }}
            content={({ active, payload, label }) => (
              <ChartTooltip active={active} payload={payload} label={label} unit="%" />
            )}
          />
          <Line
            type="monotone"
            dataKey="合格率"
            stroke="#15803d"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 4, fill: "#15803d", stroke: "#ffffff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#15803d", stroke: "#ffffff", strokeWidth: 2 }}
          >
            {/* 今月の値だけ点の上に出す */}
            <LabelList
              dataKey="合格率"
              content={({ x, y, value, index }) =>
                index === lastIndex ? (
                  <text
                    x={Number(x)}
                    y={Number(y) - 12}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="#0a0a0a"
                  >
                    {String(value)}%
                  </text>
                ) : null
              }
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>

      {/* 表に直接 sr-only を付けると高さが潰れず縦に伸びるので、div で包んで隠す */}
      <div className="sr-only">
        <table>
          <caption>月別の合格率</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th>{d.label}</th>
                <td>{d.合格率}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
