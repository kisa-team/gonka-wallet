import "server-only";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";
import { getJson } from "@/src/utils/fetch-helpers";

interface GonkaExchangeStatResponse {
    community_pool: number;
    epoch_id: number;
    genesis_accounts_count: number;
    genesis_in_vesting: number;
    genesis_total: number;
    genesis_unlocked: number;
    median_price_ask: number;
    median_price_bid: number;
    module_accounts_count: number;
    module_balance: number;
    total_mining_rewards: number;
    total_supply: number;
    updated_at: string;
    user_accounts_count: number;
    user_circulating: number;
    user_in_vesting: number;
    user_unlocked: number;
    volume_ask: number;
    volume_bid: number;
}

export interface GonkaPriceResponse {
    price: number;
}

export const revalidate = 300;

export const GET = fnDecorator([apiRequestWrapper], async () => {
    const data = await getJson<GonkaExchangeStatResponse>(
        "https://dev.herewallet.app/api/v1/exchange/limit_orders/gonka/stat"
    );
    return apiResponse<GonkaPriceResponse>({
        price: data.median_price_bid || 0,
    });
}) as ApiFunc;
