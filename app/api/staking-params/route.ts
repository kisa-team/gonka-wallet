import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, getChainApiUrl } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";

export interface StakingParams {
    unbonding_time: string;
    max_validators: number;
    max_entries: number;
    historical_entries: number;
    bond_denom: string;
    min_commission_rate: string;
    min_self_delegation?: string;
}

interface CosmosApiResponse {
    params?: StakingParams;
}

export interface StakingParamsResponse {
    params: StakingParams | null;
}

export const GET = fnDecorator([apiRequestWrapper], async (_: NextRequest) => {
    const url = `${getChainApiUrl()}/cosmos/staking/v1beta1/params`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
        return apiResponse(undefined, "Failed to fetch staking params", {
            status: response.status,
        });
    }

    const data: CosmosApiResponse = await response.json();

    const result: StakingParamsResponse = {
        params: data.params || null,
    };

    return apiResponse(result);
}) as ApiFunc;
