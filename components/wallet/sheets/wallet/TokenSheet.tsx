"use client";
import { Button } from "@heroui/react";
import type { FC } from "react";
import { PiHandDeposit, PiHandWithdraw } from "react-icons/pi";
import { formatTokenBalance, getTokenBalance } from "@/components/helpers";
import { Logo } from "@/components/ui/Logo";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import ValueUtils from "@/src/utils/ValueUtils";

export const TokenSheet: FC = () => {
    const isOpen = useWalletStore((state) => state.sheets.token);
    const token = useWalletStore((state) => state.selectedToken);
    const balances = useWalletStore((state) => state.balances);
    if (!token) return null;
    const balance = balances.find((balance) => balance.denom === token.base);
    const balanceAmount = getTokenBalance(balance, token.denom, token.exponent);
    const balanceUSD = balanceAmount * token.priceUSD;

    const handleSend = () => {
        useWalletStore.getState().openSheet("send");
    };

    const handleReceive = () => {
        useWalletStore.getState().openSheet("receive");
    };

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("token", open)}
            side="right"
            parentSelector="#screens"
        >
            <SheetHeader>{token.name}</SheetHeader>
            <SheetBody className="flex flex-col gap-6 px-4">
                <div className="flex flex-col items-center gap-4">
                    <Logo
                        name={token.name}
                        iconUrl={token.iconUrl}
                        iconBase64={token.iconBase64}
                        className="!w-20 !h-20 !rounded-full !text-4xl"
                    />
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-3xl font-bold">
                            {formatTokenBalance(balance, token.denom, token.exponent)}{" "}
                            {token.symbol}
                        </div>
                        <div className="text-lg text-zinc-400">
                            ${ValueUtils.formatMoney(balanceUSD)}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1 w-fit mx-auto">
                        <Button
                            variant="light"
                            className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                            onPress={handleSend}
                        >
                            <PiHandDeposit className="w-6 h-6" />
                            Send
                        </Button>
                        <Button
                            variant="light"
                            className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                            onPress={handleReceive}
                        >
                            <PiHandWithdraw className="w-6 h-6" />
                            Receive
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2 bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex gap-2 items-center justify-between">
                        <span className="text-zinc-400">Price</span>
                        <span>${ValueUtils.formatMoney(token.priceUSD)}</span>
                    </div>
                    <div className="flex gap-2 items-center justify-between">
                        <span className="text-zinc-400">Symbol</span>
                        <span>{token.symbol}</span>
                    </div>
                    <div className="flex gap-2 items-center justify-between">
                        <span className="text-zinc-400">Denom</span>
                        <span className="text-xs text-zinc-400 truncate">{token.base}</span>
                    </div>
                </div>
            </SheetBody>
            <SheetFooter className="flex gap-2"></SheetFooter>
        </Sheet>
    );
};
