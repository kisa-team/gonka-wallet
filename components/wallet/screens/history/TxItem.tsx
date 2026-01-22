"use client";
import { Card } from "@heroui/react";
import type { FC } from "react";
import { IoArrowDown, IoArrowUp, IoSwapHorizontal, IoCodeSlash } from "react-icons/io5";
import { formatAddress, formatDateAgo, formatTokenAmount } from "@/components/helpers";
import type { ParsedTx } from "@/components/wallet/screens/history/parse-tx";
import type { TokenMetadata } from "@/app/api/tokens/route";

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
    if (type === "swap") {
        return (
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <IoSwapHorizontal className="w-5 h-5 text-blue-400" />
            </div>
        );
    }
    if (type === "contract") {
        return (
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <IoCodeSlash className="w-5 h-5 text-purple-400" />
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
    tokensMetadata: TokenMetadata[];
    onClick?: () => void;
}

function getLabel(tx: ParsedTx): string {
    if (tx.type === "send") return "Sent";
    if (tx.type === "receive") return "Received";
    if (tx.type === "swap") return "Swap";
    if (tx.type === "contract") {
        const action = tx.contractAction || "Contract";
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
    return "Transaction";
}

export const TxItem: FC<TxItemProps> = ({ tx, userAddress, tokensMetadata, onClick = () => {} }) => {
    const label = getLabel(tx);

    const renderAmount = () => {
        if (tx.type === "swap" && tx.swap) {
            const offerFormatted = formatTokenAmount(
                tx.swap.offerAmount,
                tx.swap.offerDenom,
                tokensMetadata
            );
            const returnFormatted = formatTokenAmount(
                tx.swap.returnAmount,
                tx.swap.returnDenom,
                tokensMetadata
            );
            return (
                <span className="font-semibold text-blue-400">
                    {offerFormatted} → {returnFormatted}
                </span>
            );
        }

        const amountColor = tx.type === "receive" ? "text-secondary/80" : "text-zinc-100";
        const amountPrefix = tx.type === "receive" ? "+" : tx.type === "send" ? "-" : "";
        const formatted = formatTokenAmount(tx.amount, tx.denom, tokensMetadata);

        return (
            <span className={`font-semibold ${amountColor}`}>
                {amountPrefix}
                {formatted}
            </span>
        );
    };

    const renderSubtitle = () => {
        if (tx.type === "swap") {
            return tx.contract ? formatAddress(tx.contract) : "Swap";
        }
        if (tx.type === "contract") {
            return tx.contract ? formatAddress(tx.contract) : tx.msgType;
        }
        const counterparty = tx.type === "send" ? tx.to : tx.from;
        if (counterparty && counterparty !== userAddress) {
            return formatAddress(counterparty);
        }
        return tx.msgType;
    };

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
                        {renderAmount()}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500 truncate">{renderSubtitle()}</span>
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
