import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, CORS_HEADERS } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";

export async function OPTIONS() {
    return apiResponse({}, undefined, { headers: CORS_HEADERS });
}

export const POST = fnDecorator([apiRequestWrapper], async (request: NextRequest) => {
    const body = await request.json();

    if (!process.env.RPC_URLS) {
        throw new Error("RPC_URLS is not set");
    }

    const rpcUrls = JSON.parse(process.env.RPC_URLS) as string[];

    let error: string | null = null;
    let status: number = 200;

    for (const rpcUrl of rpcUrls) {
        try {
            const rpcResponse = await fetch(rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            status = rpcResponse.status;
            const data = await rpcResponse.json();
            return apiResponse(data, undefined, { status, headers: CORS_HEADERS });
        } catch (e) {
            error = e instanceof Error ? e.message : String(e);
        }
    }

    return apiResponse(undefined, error, { status, headers: CORS_HEADERS });
}) as ApiFunc;
