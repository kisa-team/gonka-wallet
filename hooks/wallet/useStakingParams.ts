"use client";
import useSWR from "swr";
import type { StakingParamsResponse } from "@/app/api/staking-params/route";
import { fetcher } from "@/src/utils/fetch-helpers";

export const useStakingParams = () => {
    const { data, error, isLoading, mutate } = useSWR<StakingParamsResponse>(
        "/api/staking-params",
        fetcher,
        {
            revalidateOnFocus: false,
        }
    );

    return {
        params: data?.params || null,
        error,
        isLoading,
        mutate,
    };
};

