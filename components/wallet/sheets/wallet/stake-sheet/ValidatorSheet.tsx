"use client";
import { addToast, Button, Card, CardBody, Input, Spinner } from "@heroui/react";
import { type FC, useEffect, useState } from "react";
import type { ValidatorWithStats } from "@/app/api/validators/types";
import { formatCommission, formatTokens } from "@/components/helpers";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useDelegate } from "@/hooks/wallet/useDelegate";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";

interface ValidatorContentProps {
    validator: ValidatorWithStats | null;
}

export const ValidatorSheet: FC<ValidatorContentProps> = ({ validator }) => {
    const isOpen = useWalletStore((s) => s.sheets.validator);
    const balanceGonka = useWalletStore((state) => state.balanceGonka);
    const { delegate, status: delegateStatus, error, reset } = useDelegate();
    const [amount, setAmount] = useState<string>("");
    const [isDelegating, setIsDelegating] = useState(false);

    useEffect(() => {
        if (delegateStatus === "success") {
            addToast({
                title: "Tokens successfully staked",
                description: "Your tokens have been delegated to the validator",
                color: "success",
            });
            useWalletStore.getState().updateBalance();
            setTimeout(() => {
                reset();
                setAmount("");
                setIsDelegating(false);
                useWalletStore.getState().closeSheet("validator");
            }, 2000);
        }
    }, [delegateStatus, reset]);

    useEffect(() => {
        if (!validator) {
            setAmount("");
            setIsDelegating(false);
            reset();
        }
    }, [validator, reset]);

    const handleDelegate = async () => {
        if (!validator || !amount) return;

        const amountNum = parseFloat(amount);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
            addToast({
                title: "Error",
                description: "Enter a valid amount of tokens",
                color: "danger",
            });
            return;
        }

        if (amountNum > balanceGonka) {
            addToast({
                title: "Error",
                description: "Not enough tokens on the balance",
                color: "danger",
            });
            return;
        }

        if (validator.min_self_delegation) {
            const minDelegationGNK =
                Number(validator.min_self_delegation) / GonkaWallet.NGONKA_TO_GONKA;
            if (amountNum < minDelegationGNK) {
                addToast({
                    title: "Error",
                    description: `Minimum delegation amount for this validator: ${minDelegationGNK.toFixed(2)} GNK`,
                    color: "danger",
                });
                return;
            }
        }

        setIsDelegating(true);
        await delegate(validator.operator_address, amountNum);
        setIsDelegating(false);
    };

    const isProcessing =
        delegateStatus === "signing" ||
        delegateStatus === "broadcasting" ||
        delegateStatus === "pending";

    if (!validator) {
        return null;
    }

    const title =
        validator.stats.operator_address === validator.operator_address &&
        validator.operator_address !== validator.description?.moniker
            ? validator.description?.moniker || "Unknown"
            : validator.stats.account_address;

    const subtitle = validator.description?.website || "";

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("validator", open)}
            side="right"
            parentSelector="#screens"
        >
            <SheetHeader>Stake Tokens</SheetHeader>
            <SheetBody className="px-4 py-4 space-y-4 overflow-y-auto">
                <Card className="bg-zinc-800/50" shadow="none">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="font-semibold text-zinc-100 truncate">{title}</div>
                            <div className="text-xs text-zinc-400 truncate">{subtitle}</div>
                        </div>
                        <div className="space-y-2 text-xs text-zinc-400">
                            <div className="flex justify-between">
                                <span>Commission:</span>
                                <span>
                                    {formatCommission(validator.commission.commission_rates.rate)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total staked:</span>
                                <span>{formatTokens(validator.tokens)}</span>
                            </div>
                            {validator.stats && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Reputation:</span>
                                        <span>{validator.stats.reputation}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Completed epochs:</span>
                                        <span>{validator.stats.epochs_completed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Earned (current epoch):</span>
                                        <span>
                                            {formatTokens(
                                                validator.stats.earned_coins_current_epoch
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Rewarded (last epoch):</span>
                                        <span>
                                            {formatTokens(
                                                validator.stats.rewarded_coins_latest_epoch
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardBody>
                </Card>

                <div className="space-y-3">
                    <Input
                        label="Amount of GNK"
                        type="number"
                        value={amount}
                        onValueChange={setAmount}
                        variant="bordered"
                        placeholder="0.0"
                        isDisabled={isProcessing}
                        endContent={
                            <Button
                                size="sm"
                                variant="light"
                                onPress={() => setAmount(balanceGonka.toString())}
                                isDisabled={isProcessing}
                            >
                                Max
                            </Button>
                        }
                    />
                    <div className="space-y-1 text-xs text-zinc-400">
                        <div>Available: {balanceGonka.toFixed(4)} GNK</div>
                        {/* {validator.min_self_delegation &&
                            Number(validator.min_self_delegation) > 0 && (
                                <div className="text-yellow-400">
                                    Minimum delegation amount for this validator:{" "}
                                    {(
                                        Number(validator.min_self_delegation) /
                                        GonkaWallet.NGONKA_TO_GONKA
                                    ).toFixed(2)}{" "}
                                    GNK
                                </div>
                            )} */}
                    </div>
                </div>

                {isProcessing && (
                    <div className="flex items-center gap-2 p-3 bg-zinc-700/50 rounded-lg">
                        <Spinner size="sm" color="primary" />
                        <span className="text-xs text-zinc-300">
                            {delegateStatus === "signing" && "Signing transaction..."}
                            {delegateStatus === "broadcasting" && "Broadcasting transaction..."}
                            {delegateStatus === "pending" && "Waiting for confirmation..."}
                        </span>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400">{error}</p>
                    </div>
                )}
            </SheetBody>
            <SheetFooter>
                <Button
                    color="primary"
                    className="w-full"
                    onPress={handleDelegate}
                    isDisabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                    isLoading={isDelegating}
                >
                    Stake
                </Button>
            </SheetFooter>
        </Sheet>
    );
};
