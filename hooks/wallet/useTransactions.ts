"use client";
import useSWRInfinite from "swr/infinite";
import type { TransactionsResponse } from "@/app/api/transactions/route";
import { fetcher } from "@/src/utils/fetch-helpers";

const PAGE_SIZE = 20;

export const useTransactions = (address: string | null | undefined) => {
    const getKey = (_pageIndex: number, previousPageData: TransactionsResponse | null) => {
        if (!address) return null;
        if (previousPageData && !previousPageData.hasMore) return null;

        const cursor = previousPageData?.nextCursor;
        const params = new URLSearchParams({
            address,
            limit: PAGE_SIZE.toString(),
        });

        if (cursor) {
            params.set("cursor", cursor);
        }

        return `/api/transactions?${params.toString()}`;
    };

    const result = useSWRInfinite<TransactionsResponse>(getKey, fetcher, {
        revalidateFirstPage: false,
        revalidateOnFocus: false,
    });

    const transactions = result.data?.flatMap((page) => page.transactions) ?? [];
    const isLoadingInitial = !result.data && !result.error;
    const isLoadingMore =
        result.isLoading ||
        (result.size > 0 && result.data && typeof result.data[result.size - 1] === "undefined");
    const isEmpty = result.data?.[0]?.transactions.length === 0;
    const lastPage = result.data?.[result.data.length - 1];
    const isReachingEnd = isEmpty || (lastPage && !lastPage.hasMore);

    return {
        transactions,
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
