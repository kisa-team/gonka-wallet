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
    async (
        request: NextRequest,
        context: { params: Promise<{ port: string; path: string[] }> }
    ) => {
        return await proxyRequest(request, context);
    }
) as ApiFunc;

export const POST = fnDecorator(
    [apiRequestWrapper],
    async (
        request: NextRequest,
        context: { params: Promise<{ port: string; path: string[] }> }
    ) => {
        return await proxyRequest(request, context);
    }
) as ApiFunc;

async function proxyRequest(
    request: NextRequest,
    context: { params: Promise<{ port: string; path: string[] }> }
) {
    const params = await context.params;
    const protocol = getProtocol(params.port);
    const path = request.nextUrl.pathname.endsWith("chain-rpc")
        ? `${params.path.join("/")}/`
        : params.path.join("/");

    const queryString = request.nextUrl.search;
    const body = request.method === "POST" ? await request.json() : undefined;

    let error: string | null = null;
    let status: number = 200;
    let attempts: number = 0;
    const start = performance.now();

    const hostnames = getBestHosts(params.port);
    for (const hostname of hostnames) {
        try {
            attempts++;
            const url = new URL(`${protocol}://${hostname}:${params.port}/${path}${queryString}`);
            const response = await fetch(url, {
                method: request.method,
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(5000),
            });
            status = response.status;
            const data = await response.json();
            const metadata = {
                provider: url.origin,
                duration: performance.now() - start,
                attempts,
            };
            increaseHostPriority(params.port, hostname);
            return apiResponse({ ...data, metadata }, undefined, {
                status,
                headers: CORS_HEADERS,
            });
        } catch (e) {
            decreaseHostPriority(params.port, hostname);
            error = e instanceof Error ? e.message : String(e);
        }
    }

    return apiResponse(undefined, error, { status, headers: CORS_HEADERS });
}

const MAX_HOST_PRIORITY = 5;
const hostPrioritiesByPort: Map<string, Map<string, number>> = new Map();
const prioritizedHostCache: Map<string, string[]> = new Map();

function getBestHosts(port: string): string[] {
    const cached = prioritizedHostCache.get(port);
    if (cached) {
        return cached;
    }

    const hostPriorities = getHostPrioritiesForPort(port);
    const entries = Array.from(hostPriorities.entries());
    entries.sort((a, b) => b[1] - a[1]);
    const sorted = entries.map((entry) => entry[0]);
    prioritizedHostCache.set(port, sorted);
    return sorted;
}

function increaseHostPriority(port: string, hostname: string): void {
    const hostPriorities = getHostPrioritiesForPort(port);
    const currentPriority = hostPriorities.get(hostname) || 0;
    if (currentPriority >= MAX_HOST_PRIORITY) {
        return;
    }
    hostPriorities.set(hostname, currentPriority + 1);
    invalidateCache(port);
}

function decreaseHostPriority(port: string, hostname: string): void {
    const hostPriorities = getHostPrioritiesForPort(port);
    const currentPriority = hostPriorities.get(hostname) || 0;
    if (currentPriority <= 0) {
        return;
    }
    hostPriorities.set(hostname, currentPriority - 1);
    invalidateCache(port);
}

function getHostPrioritiesForPort(port: string): Map<string, number> {
    let hostPriorities = hostPrioritiesByPort.get(port);
    if (!hostPriorities) {
        const domains = getNodeDomains();
        hostPriorities = new Map<string, number>();
        for (const domain of domains) {
            hostPriorities.set(domain, 0);
        }
        hostPrioritiesByPort.set(port, hostPriorities);
        invalidateCache(port);
    }
    return hostPriorities;
}

function invalidateCache(port: string): void {
    prioritizedHostCache.delete(port);
}

function getNodeDomains(): string[] {
    if (!process.env.NODE_DOMAINS) {
        throw new Error("NODE_DOMAINS is not set");
    }
    return JSON.parse(process.env.NODE_DOMAINS) as string[];
}

function getProtocol(port: string): string {
    return port === "8443" ? "https" : "http";
}
