export interface ParsedTx {
    txhash: string;
    height: string;
    timestamp: string;
    type: "send" | "receive" | "other";
    msgType: string;
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
}

export function parseTx(tx: any, userAddress: string): ParsedTx {
    const messages = tx.tx?.body?.messages || [];
    const firstMsg = messages[0];
    const msgType = firstMsg?.["@type"] || "";

    let type: ParsedTx["type"] = "other";
    let amount = "0";
    let denom = "ngonka";
    let from = "";
    let to = "";

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
    }

    const feeInfo = tx.tx?.auth_info?.fee;
    const feeCoins = feeInfo?.amount?.[0];
    const fee = feeCoins?.amount || "0";
    const gasLimit = feeInfo?.gas_limit || tx.gas_wanted || "0";
    const gasPrice = Number(gasLimit) > 0 ? (Number(fee) / Number(gasLimit)).toFixed(4) : "0";

    const code = tx.code ?? 0;
    const isSuccess = code === 0;

    return {
        txhash: tx.txhash || "",
        height: tx.height || "0",
        timestamp: tx.timestamp || "",
        type,
        msgType: msgType.split(".").pop() || "Unknown",
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
    };
}
