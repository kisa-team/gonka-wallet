"use client";
import { Card, CardBody, Spinner } from "@heroui/react";
import type { FC } from "react";
import { formatBalance, getBalanceAmount } from "@/components/helpers";
import { Logo } from "@/components/ui/Logo";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import ValueUtils from "@/src/utils/ValueUtils";

export const Tokens: FC = () => {
    const balances = useWalletStore((state) => state.balances);
    const tokensMetadata = useWalletStore((state) => state.tokensMetadata);
    const isTokensLoading = useWalletStore((state) => state.isTokensLoading);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-400">
                <div>Tokens</div>
                {isTokensLoading && <Spinner size="sm" color="default" />}
            </div>
            <div className="flex flex-col gap-2">
                {tokensMetadata.map((token) => {
                    const balance = balances.find((balance) => balance.denom === token.base);
                    const balanceAmount = getBalanceAmount(balance, token.denom, token.exponent);
                    return (
                        <Card key={token.base} shadow="none" className="bg-zinc-800/50">
                            <CardBody>
                                <div className="flex gap-2">
                                    <Logo
                                        name={token.name}
                                        iconUrl={token.iconUrl}
                                        iconBase64={token.iconBase64}
                                        className="!w-12 !h-12 !rounded-full !text-2xl"
                                    />

                                    <div className="flex flex-col w-full">
                                        <div>{token.name}</div>
                                        <div className="text-sm text-zinc-400">
                                            ${ValueUtils.formatMoney(token.priceUSD)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div>
                                            $
                                            {ValueUtils.formatMoney(balanceAmount * token.priceUSD)}
                                        </div>
                                        <div className="text-sm text-zinc-400 shrink-0">
                                            {formatBalance(balance, token.denom, token.exponent)}{" "}
                                            {token.symbol}
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
