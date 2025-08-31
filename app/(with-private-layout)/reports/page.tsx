"use client"

import { Suspense } from "react"
import ReportsPage from "./Reports"

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportsPage />
        </Suspense>
    )
}
