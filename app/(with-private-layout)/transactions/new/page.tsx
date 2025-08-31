"use client"

import { Suspense } from "react"
import NewTransactionPage from "./NewTransactionPage"

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewTransactionPage />
        </Suspense>
    )
}
