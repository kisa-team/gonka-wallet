"use client";
import { Spinner } from "@heroui/react";
import { type FC, useMemo } from "react";
import { getBalanceAmount } from "@/components/helpers";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import ValueUtils from "@/src/utils/ValueUtils";

export const TotalBalanceUSD: FC = () => {
    const isBalanceLoading = useWalletStore((state) => state.isTokensLoading);
    const balances = useWalletStore((state) => state.balances);
    const tokensMetadata = useWalletStore((state) => state.tokensMetadata);

    const totalBalanceUSD = useMemo(() => {
        return balances.reduce((acc, balance) => {
            const token = tokensMetadata.find((token) => token.base === balance.denom);
            if (!token) {
                return acc;
            }
            return (
                acc + (token.priceUSD || 0) * getBalanceAmount(balance, token.denom, token.exponent)
            );
        }, 0);
    }, [balances, tokensMetadata]);

    return (
        <div className="flex flex-col items-center">
            <div className="text-center text-2xl">${ValueUtils.formatMoney(totalBalanceUSD)}</div>
            <div className="text-sm text-zinc-400 h-5">
                {isBalanceLoading && (
                    <div className="flex items-center gap-1">
                        Updating
                        <Spinner size="sm" color="default" />
                    </div>
                )}
            </div>
        </div>
    );
};
