"use client";
import useSWR, { type SWRConfiguration } from "swr";
import type { WebAppsResponse } from "@/app/api/web-apps/route";
import { fetcher } from "@/src/utils/fetch-helpers";

export const useWebApps = (canLoad = true, config?: SWRConfiguration) => {
    return useSWR<WebAppsResponse>(canLoad ? "/api/web-apps" : null, fetcher, config);
};
