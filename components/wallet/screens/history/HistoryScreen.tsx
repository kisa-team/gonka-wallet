"use client";
import { Spinner } from "@heroui/react";
import { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ParsedTx, parseTx } from "@/components/wallet/screens/history/parse-tx";
import { TxItem } from "@/components/wallet/screens/history/TxItem";
import { TxItemSheet } from "@/components/wallet/screens/history/TxItemSheet";
import { useTransactions } from "@/hooks/wallet/useTransactions";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const HistoryScreen: FC = () => {
    const userWallet = useWalletStore((s) => s.userWallet);
    const tokensMetadata = useWalletStore((s) => s.tokensMetadata);
    const { transactions, isLoadingInitial, isLoadingMore, isReachingEnd, setSize, size } =
        useTransactions(userWallet?.account?.address);
    const [selectedTx, setSelectedTx] = useState<ParsedTx | null>(null);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const parsedTxs = useMemo(() => {
        if (!userWallet?.account?.address) return [];
        return transactions.map((tx) => parseTx(tx, userWallet.account.address));
    }, [transactions, userWallet?.account?.address]);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && !isReachingEnd) {
            setSize(size + 1);
        }
    }, [isLoadingMore, isReachingEnd, setSize, size]);

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [loadMore]);

    return (
        <>
            <div className="flex flex-col gap-3 p-4 pb-6 h-full overflow-y-auto">
                {isLoadingInitial && (
                    <Spinner size="lg" color="primary" variant="wave" className="m-auto" />
                )}

                {!isLoadingInitial && parsedTxs.length === 0 && (
                    <div className="text-center text-zinc-400 m-auto">No transactions found</div>
                )}

                {parsedTxs.map((tx) => (
                    <TxItem
                        key={tx.txhash}
                        tx={tx}
                        userAddress={userWallet?.account?.address || ""}
                        tokensMetadata={tokensMetadata}
                        onClick={() => setSelectedTx(tx)}
                    />
                ))}

                <div ref={loadMoreRef} className="h-1" />

                {isLoadingMore && !isLoadingInitial && (
                    <Spinner size="sm" color="primary" className="mx-auto my-2" />
                )}

                {isReachingEnd && parsedTxs.length > 0 && (
                    <div className="text-center text-zinc-500 text-sm py-2">
                        No more transactions
                    </div>
                )}
            </div>
            <TxItemSheet
                tx={selectedTx}
                tokensMetadata={tokensMetadata}
                open={!!selectedTx}
                onOpenChange={(open) => setSelectedTx(open ? selectedTx : null)}
            />
        </>
    );
};
