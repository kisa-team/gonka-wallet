"use client";
import useSWR, { type SWRConfiguration } from "swr";
import type { WebAppResponse } from "@/app/api/web-apps/[slug]/route";
import { fetcher } from "@/src/utils/fetch-helpers";

export const useWebApp = (
    idOrKey: number | string | null | undefined,
    canLoad = true,
    config?: SWRConfiguration
) => {
    return useSWR<WebAppResponse>(
        idOrKey && canLoad ? `/api/web-apps/${idOrKey}` : null,
        fetcher,
        config
    );
};
