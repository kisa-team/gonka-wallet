import "server-only";
import { NextResponse } from "next/server";
import type { ObjectType } from "@/src/types/primitives";
import { reviveDates } from "@/src/utils/fetch-helpers";

export function apiResponse<D extends Record<string, any> | undefined | null>(
    data?: D,
    error?: string | null,
    init?: ResponseInit
): NextResponse {
    if (error) {
        return NextResponse.json({ error }, { status: 400, ...init });
    }
    return NextResponse.json(data, init);
}

export function getApiQuery<T extends ObjectType>(
    request: Request,
    fields: (keyof T)[],
    required: (keyof T)[] = []
): T {
    const query: T = {} as T;
    const { searchParams } = new URL(request.url);
    for (const field of fields) {
        if (searchParams.has(field as string)) {
            // @ts-expect-error ...
            query[field] = searchParams.get(field);
        }
    }

    for (const field of required) {
        if (!searchParams.has(field as string)) {
            throw new Error(`Parameter not found: ${String(field)}`);
        }
        // @ts-expect-error ...
        query[field] = searchParams.get(field);
    }

    return query;
}

export async function getApiBody<T extends ObjectType>(
    request: Request,
    requireFields: (keyof T)[],
    optionalFields: (keyof T)[] = []
): Promise<T> {
    const body: T = {} as T;
    const r = request.clone();
    const text = await r.text();
    let json: T = {} as T;

    try {
        json = JSON.parse(text, reviveDates);
    } catch {
        throw new Error("Invalid JSON");
    }

    for (const field of requireFields) {
        if (!Object.hasOwn(json, field)) {
            throw new Error(`Parameter not found: ${String(field)}`);
        }
        body[field] = json[field];
    }

    for (const field of optionalFields) {
        if (Object.hasOwn(json, field)) {
            body[field] = json[field];
        }
    }

    return body;
}

export function getApiUrl(): string {
    if (!process.env.NEXT_PUBLIC_WEBAPP_URL) {
        throw new Error("NEXT_PUBLIC_WEBAPP_URL is not set");
    }
    return `${process.env.NEXT_PUBLIC_WEBAPP_URL}/api`;
}

export function getChainApiUrl(): string {
    return `${getApiUrl()}/chain-api`;
}

export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};
