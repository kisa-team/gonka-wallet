import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, CORS_HEADERS } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";

export async function OPTIONS() {
    return apiResponse({}, undefined, { headers: CORS_HEADERS });
}

export const GET = fnDecorator(
    [apiRequestWrapper],
    async (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => {
        const { path } = await context.params;
        const apiPath = `/${path.join("/")}`;
        const queryString = request.nextUrl.search;

        if (!process.env.CHAIN_API_URLS) {
            throw new Error("CHAIN_API_URLS is not set");
        }

        const apiUrls = JSON.parse(process.env.CHAIN_API_URLS) as string[];

        let error: string | null = null;
        let status: number = 200;

        for (const apiUrl of apiUrls) {
            try {
                const url = `${apiUrl}${apiPath}${queryString}`;
                const response = await fetch(url, { method: "GET" });
                status = response.status;
                const data = await response.json();
                return apiResponse(data, undefined, { status, headers: CORS_HEADERS });
            } catch (e) {
                error = e instanceof Error ? e.message : String(e);
            }
        }

        return apiResponse(undefined, error, { status, headers: CORS_HEADERS });
    }
) as ApiFunc;
