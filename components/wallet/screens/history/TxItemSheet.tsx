"use client";
import type { FC } from "react";
import { IoCopy } from "react-icons/io5";
import type { TokenMetadata } from "@/app/api/tokens/route";
import {
    formatAddress,
    formatFullDate,
    formatTokenAmount,
    formatTxHash,
    ngonkaToGonka,
} from "@/components/helpers";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import type { ParsedTx } from "@/components/wallet/screens/history/parse-tx";
import { useCopyTextToClipboard } from "@/hooks/useCopyTextToClipboard";

const InfoRow: FC<{ label: string; value: string; copyValue?: string }> = ({
    label,
    value,
    copyValue,
}) => {
    const copy = useCopyTextToClipboard();

    const handleCopy = () => {
        if (copyValue) copy(copyValue);
    };

    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-500">{label}</span>
            {copyValue ? (
                <button
                    type="button"
                    className="text-zinc-400 truncate max-w-[60%] text-right cursor-pointer hover:text-zinc-300 flex items-center gap-1"
                    onClick={handleCopy}
                    title={copyValue}
                >
                    {value}
                    <IoCopy className="w-3 h-3 flex-shrink-0" />
                </button>
            ) : (
                <span className="text-zinc-400 truncate max-w-[60%] text-right" title={value}>
                    {value}
                </span>
            )}
        </div>
    );
};

export interface TxItemSheetProps {
    tx: ParsedTx | null;
    tokensMetadata: TokenMetadata[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function getTypeLabel(tx: ParsedTx): string {
    if (tx.type === "swap") return "Swap";
    if (tx.type === "contract") {
        const action = tx.contractAction || tx.msgType;
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
    return tx.msgType;
}

export const TxItemSheet: FC<TxItemSheetProps> = ({ tx, tokensMetadata, open, onOpenChange }) => {
    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            contentFit="content"
            side="bottom"
            parentSelector="#screens"
        >
            <SheetHeader>Transaction Details</SheetHeader>
            <SheetBody className="space-y-2 px-4">
                {tx && (
                    <>
                        <InfoRow
                            label="Hash"
                            value={formatTxHash(tx.txhash)}
                            copyValue={tx.txhash}
                        />
                        <InfoRow label="Time" value={formatFullDate(tx.timestamp)} />
                        <InfoRow label="Block" value={tx.height} />
                        <InfoRow label="Type" value={getTypeLabel(tx)} />
                        <InfoRow
                            label="Status"
                            value={tx.success ? "Success" : `Failed (code: ${tx.code})`}
                        />
                        <InfoRow label="From" value={formatAddress(tx.from)} copyValue={tx.from} />
                        {tx.contract && (
                            <InfoRow
                                label="Contract"
                                value={formatAddress(tx.contract)}
                                copyValue={tx.contract}
                            />
                        )}
                        {tx.to && tx.to !== tx.contract && (
                            <InfoRow label="To" value={formatAddress(tx.to)} copyValue={tx.to} />
                        )}
                        {tx.type === "swap" && tx.swap && (
                            <>
                                <div className="border-t border-zinc-700 my-2" />
                                <InfoRow
                                    label="You Paid"
                                    value={formatTokenAmount(
                                        tx.swap.offerAmount,
                                        tx.swap.offerDenom,
                                        tokensMetadata
                                    )}
                                />
                                <InfoRow
                                    label="You Received"
                                    value={formatTokenAmount(
                                        tx.swap.returnAmount,
                                        tx.swap.returnDenom,
                                        tokensMetadata
                                    )}
                                />
                                <div className="border-t border-zinc-700 my-2" />
                            </>
                        )}
                        <InfoRow label="Fee" value={ngonkaToGonka(tx.fee)} />
                        <InfoRow label="Gas Used" value={Number(tx.gasUsed).toLocaleString()} />
                        <InfoRow label="Gas Limit" value={Number(tx.gasLimit).toLocaleString()} />
                        <InfoRow label="Gas Price" value={tx.gasPrice} />
                    </>
                )}
            </SheetBody>
            <SheetFooter></SheetFooter>
        </Sheet>
    );
};
