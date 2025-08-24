"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    LabelList
} from "recharts"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/app/components/ui/card"

export function WeeklyTransactionsChart({ data }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Transactions (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                            dataKey="_id"
                            type="category"
                            tick={{ fontSize: 12 }}
                            width={90}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6">
                            <LabelList dataKey="count" position="right" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
