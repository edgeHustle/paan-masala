"use client"

import { Suspense } from "react"
import TransactionsPage from "./Transactions"

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TransactionsPage />
        </Suspense>
    )
}
