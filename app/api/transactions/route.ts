import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, getChainApiUrl } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";

const MAX_LIMIT = 100;
const FETCH_MULTIPLIER = 2;

interface TxResponse {
    txhash: string;
    height: string;
    timestamp: string;
    tx: unknown;
    logs: unknown[];
    events: unknown[];
    code?: number;
    raw_log?: string;
}

interface CosmosApiResponse {
    tx_responses?: TxResponse[];
    pagination?: {
        next_key: string | null;
        total: string;
    };
}

export interface TransactionsResponse {
    transactions: TxResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}

function buildQuery(address: string, type: "sender" | "recipient"): string {
    return type === "sender" ? `message.sender='${address}'` : `transfer.recipient='${address}'`;
}

async function fetchTxs(
    address: string,
    type: "sender" | "recipient",
    limit: number
): Promise<TxResponse[]> {
    const query = buildQuery(address, type);
    const url = `${getChainApiUrl()}/cosmos/tx/v1beta1/txs?query=${encodeURIComponent(query)}&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return [];

    const data: CosmosApiResponse = await response.json();
    return data.tx_responses || [];
}

function dedupeAndSort(txs: TxResponse[]): TxResponse[] {
    const seen = new Set<string>();
    return txs
        .filter((tx) => {
            if (seen.has(tx.txhash)) return false;
            seen.add(tx.txhash);
            return true;
        })
        .sort((a, b) => Number(b.height) - Number(a.height));
}

export const GET = fnDecorator([apiRequestWrapper], async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get("address");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, MAX_LIMIT);

    if (!address) {
        return apiResponse(undefined, "address is required", { status: 400 });
    }

    const fetchLimit = limit * FETCH_MULTIPLIER;

    const [sentTxs, receivedTxs] = await Promise.all([
        fetchTxs(address, "sender", fetchLimit),
        fetchTxs(address, "recipient", fetchLimit),
    ]);

    let allTxs = dedupeAndSort([...sentTxs, ...receivedTxs]);

    if (cursor) {
        const cursorHeight = Number(cursor);
        allTxs = allTxs.filter((tx) => Number(tx.height) < cursorHeight);
    }

    const hasMore = allTxs.length > limit;
    const transactions = allTxs.slice(0, limit);
    const lastTx = transactions[transactions.length - 1];
    const nextCursor = hasMore && lastTx ? lastTx.height : null;

    const response: TransactionsResponse = {
        transactions,
        nextCursor,
        hasMore,
    };

    return apiResponse(response);
}) as ApiFunc;
