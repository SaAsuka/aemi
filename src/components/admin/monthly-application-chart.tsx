"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

type DataPoint = {
  label: string
  応募中: number
  書類送付済: number
  合格: number
  不合格: number
  合計: number
}

export function MonthlyApplicationChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value, name) => [`${value}件`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="合格" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
        <Bar dataKey="書類送付済" stackId="a" fill="#3b82f6" />
        <Bar dataKey="応募中" stackId="a" fill="#a3a3a3" />
        <Bar dataKey="不合格" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
