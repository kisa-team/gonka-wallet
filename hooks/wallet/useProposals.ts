"use client";
import useSWRInfinite from "swr/infinite";
import type { ProposalsResponse } from "@/app/api/proposals/types";
import { fetcher } from "@/src/utils/fetch-helpers";

const PAGE_SIZE = 20;

type ProposalType = "active" | "passed" | "rejected";

export const useProposals = (type: ProposalType) => {
    const getKey = (_pageIndex: number, previousPageData: ProposalsResponse | null) => {
        if (previousPageData && !previousPageData.hasMore) return null;

        const cursor = previousPageData?.nextCursor;
        const params = new URLSearchParams({
            limit: PAGE_SIZE.toString(),
        });

        if (cursor) {
            params.set("cursor", cursor);
        }

        return `/api/proposals/${type}?${params.toString()}`;
    };

    const result = useSWRInfinite<ProposalsResponse>(getKey, fetcher, {
        revalidateFirstPage: false,
        revalidateOnFocus: false,
    });

    const proposals = result.data?.flatMap((page) => page.proposals) ?? [];
    const isLoadingInitial = !result.data && !result.error;
    const isLoadingMore =
        result.isLoading ||
        (result.size > 0 && result.data && typeof result.data[result.size - 1] === "undefined");
    const isEmpty = result.data?.[0]?.proposals.length === 0;
    const lastPage = result.data?.[result.data.length - 1];
    const isReachingEnd = isEmpty || (lastPage && !lastPage.hasMore);

    return {
        proposals,
        error: result.error,
        isLoadingInitial,
        isLoadingMore,
        isEmpty,
        isReachingEnd,
        size: result.size,
        setSize: result.setSize,
        mutate: result.mutate,
    };
};
