"use client";
import useSWR from "swr";
import type { VoteCounts } from "@/app/api/proposals/types";
import { fetcher } from "@/src/utils/fetch-helpers";

export const useProposalVotes = (proposalId: string | null, enabled: boolean = true) => {
    const { data, error, isLoading, mutate } = useSWR<VoteCounts>(
        enabled && proposalId ? `/api/proposals/${proposalId}/votes` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    return {
        votes: data,
        isLoading,
        error,
        mutate,
    };
};

