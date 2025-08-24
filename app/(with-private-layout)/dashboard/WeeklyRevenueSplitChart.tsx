"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"

type DataItem = {
    day: string
    cash: number
    credit: number
}

export function WeeklyRevenueSplitChart({ data }: { data: DataItem[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Split last 7 days(Cash vs Credit)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="paid" stackId="a" fill="#10B981" name="Cash" />
                        <Bar dataKey="due" stackId="a" fill="#3B82F6" name="Credit" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
