import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const res = await fetch(`${BACKEND_URL}/api/contracts/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(120000), // 2 min timeout for large contracts
        });

        const data = await res.json().catch(() => ({ detail: "Backend returned non-JSON response" }));

        if (!res.ok) {
            return NextResponse.json(
                { detail: data.detail || `Backend error (${res.status})` },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[Proxy] /api/contracts/analyze error:", error);
        return NextResponse.json(
            { detail: error.message || "Failed to reach the analysis backend." },
            { status: 502 }
        );
    }
}
