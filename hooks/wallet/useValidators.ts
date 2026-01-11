"use client";
import useSWR from "swr";
import type { ValidatorsWithStatsResponse } from "@/app/api/validators/types";
import { fetcher } from "@/src/utils/fetch-helpers";

export const useValidators = () => {
    const { data, error, isLoading, mutate } = useSWR<ValidatorsWithStatsResponse>(
        `/api/validators`,
        fetcher
    );

    return {
        validators: data?.validators || [],
        error,
        isLoading,
        mutate,
    };
};
