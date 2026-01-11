"use client";
import { Card } from "@heroui/react";
import type { FC } from "react";
import { IoArrowDown, IoArrowUp, IoSwapHorizontal } from "react-icons/io5";
import { formatAddress, formatDateAgo, ngonkaToGonka } from "@/components/helpers";
import type { ParsedTx } from "@/components/wallet/screens/history/parse-tx";

const TxIcon: FC<{ type: ParsedTx["type"] }> = ({ type }) => {
    if (type === "send") {
        return (
            <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
                <IoArrowUp className="w-5 h-5 text-red-400" />
            </div>
        );
    }
    if (type === "receive") {
        return (
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <IoArrowDown className="w-5 h-5 text-green-400" />
            </div>
        );
    }
    return (
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
            <IoSwapHorizontal className="w-5 h-5 text-zinc-400" />
        </div>
    );
};

export interface TxItemProps {
    tx: ParsedTx;
    userAddress: string;
    onClick?: () => void;
}

export const TxItem: FC<TxItemProps> = ({ tx, userAddress, onClick = () => {} }) => {
    const label = tx.type === "send" ? "Sent" : tx.type === "receive" ? "Received" : "Transaction";
    const counterparty = tx.type === "send" ? tx.to : tx.from;
    const amountColor = tx.type === "receive" ? "text-secondary/80" : "text-zinc-100";
    const amountPrefix = tx.type === "receive" ? "+" : tx.type === "send" ? "-" : "";

    return (
        <Card
            className="bg-zinc-800/50 p-3 text-left shrink-0"
            shadow="none"
            isPressable
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                <TxIcon type={tx.type} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-zinc-100">{label}</span>
                        <span className={`font-semibold ${amountColor}`}>
                            {amountPrefix}
                            {ngonkaToGonka(tx.amount)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500 truncate">
                            {tx.type !== "other" && counterparty !== userAddress
                                ? formatAddress(counterparty)
                                : tx.msgType}
                        </span>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                            {formatDateAgo(tx.timestamp)}
                        </span>
                    </div>
                </div>
            </div>

            {tx.memo && (
                <div className="mt-2 text-xs text-zinc-400 bg-zinc-800/50 px-2 py-1.5 rounded">
                    <span className="text-zinc-500">Memo: </span>
                    {tx.memo}
                </div>
            )}

            {!tx.success && tx.errorLog && (
                <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-2 py-1.5 rounded break-all">
                    {tx.errorLog}
                </div>
            )}
        </Card>
    );
};
