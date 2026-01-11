import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, getChainApiUrl } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";
import type { CosmosApiResponse, ProposalsResponse } from "../types";

const MAX_LIMIT = 100;

export const GET = fnDecorator([apiRequestWrapper], async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, MAX_LIMIT);

    const url = `${getChainApiUrl()}/cosmos/gov/v1/proposals?proposal_status=2&pagination.limit=${limit}&pagination.count_total=true&pagination.reverse=true${cursor ? `&pagination.key=${encodeURIComponent(cursor)}` : ""}`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
        return apiResponse(undefined, "Failed to fetch proposals", { status: response.status });
    }

    const data: CosmosApiResponse = await response.json();
    const proposals = data.proposals || [];
    const nextKey = data.pagination?.next_key;
    const total = data.pagination?.total || null;

    const result: ProposalsResponse = {
        proposals,
        nextCursor: nextKey || null,
        hasMore: !!nextKey,
        total,
    };

    return apiResponse(result);
}) as ApiFunc;
