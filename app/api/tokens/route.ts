import "server-only";
import * as Sentry from "@sentry/nextjs";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, getChainApiUrl } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import type { DenomsMetadataResponse, GonkaExchangeChartResponse } from "@/app/api/tokens/types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";
import type { Token } from "@/src/app/generated/prisma";
import prisma from "@/src/lib/prisma";
import type { FilterProps } from "@/src/types/primitives";
import { getJson } from "@/src/utils/fetch-helpers";

export type TokenMetadata = FilterProps<
    Token,
    | "base"
    | "baseDenom"
    | "denom"
    | "exponent"
    | "symbol"
    | "name"
    | "iconUrl"
    | "iconBase64"
    | "priceUSD"
>;

export interface TokensApiResponse {
    tokens: TokenMetadata[];
}

export const revalidate = 300;

export const GET = fnDecorator([apiRequestWrapper], async () => {
    await updateGonkaPrice();

    const tokens: TokenMetadata[] = await prisma.token.findMany({
        select: {
            base: true,
            baseDenom: true,
            denom: true,
            exponent: true,
            symbol: true,
            name: true,
            iconUrl: true,
            iconBase64: true,
            priceUSD: true,
        },
        orderBy: {
            order: "asc",
        },
    });
    // await appendTokensFromBank(tokens);

    return apiResponse<TokensApiResponse>({ tokens });
}) as ApiFunc;

async function updateGonkaPrice() {
    try {
        const data = await getJson<GonkaExchangeChartResponse>(
            "https://api0.herewallet.app/api/v1/exchange/chart?contract_id=native&chain_id=4444119&step=3&only_sell=true"
        );
        const price = data.chart[data.chart.length - 1][1] || 0;

        await prisma.token.updateMany({
            where: {
                base: "ngonka",
            },
            data: {
                priceUSD: price,
            },
        });
    } catch (error) {
        console.error(error);
        Sentry.captureException(error, {
            tags: {
                component: "updateGonkaPrice",
            },
        });
    }
}

// async function updateGonkaPriceFromDev() {
//     // https://api0.herewallet.app/api/v1/exchange/chart?contract_id=native&chain_id=4444119&step=3&include_volume=true&only_sell=true
//     // https://api0.herewallet.app/api/v1/exchange/chart?contract_id=native&chain_id=4444119&step=3&include_volume=true&only_buy=true
//     const data = await getJson<GonkaExchangeStatResponse>(
//         "https://dev.herewallet.app/api/v1/exchange/limit_orders/gonka/stat"
//     );
//     const ask = data.median_price_ask || 0;
//     const bid = data.median_price_bid || 0;
//     const price = (ask + bid) / 2;

//     await prisma.token.updateMany({
//         where: {
//             base: "ngonka",
//         },
//         data: {
//             priceUSD: price,
//         },
//     });
// }

async function appendTokensFromBank(tokens: TokenMetadata[]) {
    const metadatas = await getJson<DenomsMetadataResponse>(
        `${getChainApiUrl()}cosmos/bank/v1beta1/denoms_metadata`
    );
    for (const metadata of metadatas.metadatas) {
        if (tokens.find((token) => token.base === metadata.base)) {
            continue;
        }
        const minDenom = metadata.denom_units.find((unit) => unit.exponent === 0);
        if (!minDenom) {
            continue;
        }
        const maxDenom = metadata.denom_units.reduce(
            (max, unit) => (unit.exponent > max.exponent ? unit : max),
            minDenom
        );
        if (!maxDenom) {
            continue;
        }
        tokens.push({
            base: metadata.base,
            baseDenom: minDenom.denom,
            denom: maxDenom.denom,
            exponent: maxDenom.exponent,
            symbol: metadata.symbol,
            name: metadata.name,
            iconUrl: null,
            iconBase64: null,
            priceUSD: 0,
        });
    }
}
