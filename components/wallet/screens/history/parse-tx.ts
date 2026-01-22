export interface SwapInfo {
    offerAmount: string;
    offerDenom: string;
    returnAmount: string;
    returnDenom: string;
    receiver: string;
}

export interface ParsedTx {
    txhash: string;
    height: string;
    timestamp: string;
    type: "send" | "receive" | "swap" | "contract" | "other";
    msgType: string;
    contractAction?: string;
    amount: string;
    denom: string;
    from: string;
    to: string;
    memo?: string;
    fee: string;
    feeDenom: string;
    gasLimit: string;
    gasUsed: string;
    gasPrice: string;
    success: boolean;
    code: number;
    errorLog?: string;
    contract?: string;
    swap?: SwapInfo;
}

interface TxEvent {
    type: string;
    attributes: Array<{ key: string; value: string; index?: boolean }>;
}

function getEventAttribute(events: TxEvent[], eventType: string, key: string): string | undefined {
    const event = events.find((e) => e.type === eventType);
    return event?.attributes.find((a) => a.key === key)?.value;
}

function parseWasmEvent(events: TxEvent[]): { action?: string; swap?: SwapInfo } {
    const wasmEvent = events.find((e) => e.type === "wasm");
    if (!wasmEvent) return {};

    const attrs = wasmEvent.attributes;
    const getAttr = (key: string) => attrs.find((a) => a.key === key)?.value;

    const action = getAttr("action");

    if (action === "swap") {
        return {
            action,
            swap: {
                offerAmount: getAttr("offer_amount") || "0",
                offerDenom: getAttr("offer_asset") || "ngonka",
                returnAmount: getAttr("return_amount") || "0",
                returnDenom: getAttr("ask_asset") || "",
                receiver: getAttr("receiver") || "",
            },
        };
    }

    return { action };
}

export function parseTx(tx: any, userAddress: string): ParsedTx {
    const messages = tx.tx?.body?.messages || [];
    const firstMsg = messages[0];
    const msgType = firstMsg?.["@type"] || "";
    const events: TxEvent[] = tx.events || [];

    let type: ParsedTx["type"] = "other";
    let amount = "0";
    let denom = "ngonka";
    let from = "";
    let to = "";
    let contractAction: string | undefined;
    let swap: SwapInfo | undefined;

    if (msgType.includes("MsgSend")) {
        from = firstMsg.from_address || "";
        to = firstMsg.to_address || "";
        const coins = firstMsg.amount?.[0];
        amount = coins?.amount || "0";
        denom = coins?.denom || "ngonka";

        if (from === userAddress) {
            type = "send";
        } else if (to === userAddress) {
            type = "receive";
        }
    } else if (msgType.includes("MsgExecuteContract")) {
        from = firstMsg.sender || "";
        const contract = firstMsg.contract || "";
        to = contract;

        const wasmParsed = parseWasmEvent(events);
        contractAction = wasmParsed.action;

        if (wasmParsed.action === "swap" && wasmParsed.swap) {
            type = "swap";
            swap = wasmParsed.swap;
            amount = swap.offerAmount;
            denom = swap.offerDenom;
        } else {
            type = "contract";
            const funds = firstMsg.funds || [];
            const firstFund = funds[0];
            amount = firstFund?.amount || "0";
            denom = firstFund?.denom || "ngonka";
        }
    }

    const feeInfo = tx.tx?.auth_info?.fee;
    const feeCoins = feeInfo?.amount?.[0];
    const fee = feeCoins?.amount || "0";
    const gasLimit = feeInfo?.gas_limit || tx.gas_wanted || "0";
    const gasPrice = Number(gasLimit) > 0 ? (Number(fee) / Number(gasLimit)).toFixed(4) : "0";

    const code = tx.code ?? 0;
    const isSuccess = code === 0;

    const contract = msgType.includes("MsgExecuteContract") ? firstMsg?.contract : undefined;

    return {
        txhash: tx.txhash || "",
        height: tx.height || "0",
        timestamp: tx.timestamp || "",
        type,
        msgType: msgType.split(".").pop() || "Unknown",
        contractAction,
        amount,
        denom,
        from,
        to,
        memo: tx.tx?.body?.memo || undefined,
        fee,
        feeDenom: feeCoins?.denom || "ngonka",
        gasLimit,
        gasUsed: tx.gas_used || "0",
        gasPrice,
        success: isSuccess,
        code,
        errorLog: !isSuccess ? tx.raw_log : undefined,
        contract,
        swap,
    };
}
