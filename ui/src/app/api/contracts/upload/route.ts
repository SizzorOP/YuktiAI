import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const res = await fetch(`${BACKEND_URL}/api/contracts/upload`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(60000),
        });

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("[Proxy] Non-JSON response from backend:", text.slice(0, 500));
            return NextResponse.json(
                { detail: `Backend error: ${text.slice(0, 200)}` },
                { status: res.ok ? 502 : res.status }
            );
        }

        if (!res.ok) {
            return NextResponse.json(
                { detail: data.detail || `Backend error (${res.status})` },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Proxy] /api/contracts/upload error:", message);
        return NextResponse.json(
            { detail: `Failed to reach upload backend: ${message}` },
            { status: 502 }
        );
    }
}
