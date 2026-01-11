import { addToast, Button, Input, Spinner } from "@heroui/react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { HiCog8Tooth } from "react-icons/hi2";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import type { SendGNKOptions } from "@/hooks/wallet/useSendGNK";
import { DEFAULT_GAS_LIMIT, DEFAULT_GAS_PRICE, useSendGNK } from "@/hooks/wallet/useSendGNK";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";

export const SendSheet: FC = () => {
    const userWallet = useWalletStore((state) => state.userWallet);
    const balanceGonka = useWalletStore((state) => state.balanceGonka);
    const isBalanceLoading = useWalletStore((state) => state.isBalanceLoading);
    const [recipientAddress, setRecipientAddress] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [memo, setMemo] = useState<string>("");
    const [gasLimitInput, setGasLimitInput] = useState<string>(DEFAULT_GAS_LIMIT.toString());
    const [gasPriceInput, setGasPriceInput] = useState<string>(
        DEFAULT_GAS_PRICE.replace("ngonka", "")
    );
    const [isFeeSettingsOpen, setIsFeeSettingsOpen] = useState<boolean>(false);

    const { sendGNK, status, transactionHash, error, reset } = useSendGNK();
    const isOpen = useWalletStore((s) => s.sheets.send);

    useEffect(() => {
        if (status === "success") {
            addToast({
                title: "Transaction successful",
                color: "success",
                timeout: 5000,
            });
            useWalletStore.getState().updateBalance();
            setTimeout(() => {
                reset();
                useWalletStore.getState().closeSheet("send");
            }, 2000);
        }
    }, [status, reset]);

    if (!userWallet) {
        return null;
    }

    const parseGasSettings = () => {
        const parsedGasLimit = Number.parseInt(gasLimitInput, 10);
        const gasLimit =
            Number.isFinite(parsedGasLimit) && parsedGasLimit > 0
                ? parsedGasLimit
                : DEFAULT_GAS_LIMIT;

        const parsedGasPrice = Number.parseFloat(gasPriceInput);
        const gasPriceValue =
            Number.isFinite(parsedGasPrice) && parsedGasPrice > 0 ? parsedGasPrice : 0.1;
        const gasPriceString = `${gasPriceValue}ngonka`;

        const feeNgonka = gasLimit * gasPriceValue;
        const feeGnk = feeNgonka / GonkaWallet.NGONKA_TO_GONKA;

        return { gasLimit, gasPriceString, feeGnk };
    };

    const handleMaxClick = () => {
        const { feeGnk } = parseGasSettings();
        const maxSpendable = Math.max(balanceGonka - feeGnk, 0);
        setAmount(maxSpendable.toFixed(6));
    };

    const handleSend = async () => {
        if (!GonkaWallet.isValidGonkaAddress(recipientAddress)) {
            addToast({
                title: "Invalid recipient address",
                color: "danger",
                timeout: 3000,
            });
            return;
        }

        const amountNum = Number.parseFloat(amount);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
            addToast({
                title: "Invalid amount",
                color: "danger",
                timeout: 3000,
            });
            return;
        }

        const { gasLimit, gasPriceString, feeGnk } = parseGasSettings();

        if (amountNum > balanceGonka) {
            addToast({
                title: "Insufficient balance",
                color: "danger",
                timeout: 3000,
            });
            return;
        }

        if (amountNum + feeGnk > balanceGonka) {
            addToast({
                title: "Not enough for fee",
                color: "danger",
                timeout: 3000,
            });
            return;
        }

        const options: SendGNKOptions = {
            gasLimit,
            gasPrice: gasPriceString,
            memo: memo.trim() || undefined,
        };

        await sendGNK(recipientAddress, amountNum, options);
    };

    const isProcessing = status === "signing" || status === "broadcasting" || status === "pending";
    const canSend = !isProcessing && recipientAddress && amount && Number.parseFloat(amount) > 0;
    const { feeGnk } = parseGasSettings();

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("send", open)}
            side="bottom"
            parentSelector="#screens"
        >
            <SheetHeader>Send</SheetHeader>
            <SheetBody className="flex flex-col gap-4 px-4">
                <Input
                    label="Recipient Address"
                    placeholder="gonka1..."
                    value={recipientAddress}
                    onValueChange={setRecipientAddress}
                    variant="bordered"
                    isDisabled={isProcessing}
                    isInvalid={
                        recipientAddress !== "" &&
                        !GonkaWallet.isValidGonkaAddress(recipientAddress)
                    }
                    errorMessage={
                        recipientAddress !== "" &&
                        !GonkaWallet.isValidGonkaAddress(recipientAddress)
                            ? "Invalid Gonka address"
                            : undefined
                    }
                />
                <div className="flex flex-col">
                    <Input
                        label="Amount"
                        placeholder="0.00"
                        type="number"
                        value={amount}
                        onValueChange={setAmount}
                        variant="bordered"
                        isDisabled={isProcessing || isBalanceLoading}
                        endContent={
                            <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">GNK</span>
                            </div>
                        }
                    />
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-default-500 flex items-center gap-1">
                            <div>Available balance:</div>
                            <div>
                                {isBalanceLoading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    `${balanceGonka.toFixed(6)} GNK`
                                )}
                            </div>
                        </div>
                        <Button
                            type="button"
                            onPress={handleMaxClick}
                            isDisabled={isProcessing || isBalanceLoading || balanceGonka === 0}
                            isIconOnly
                            variant="light"
                            className="text-primary"
                        >
                            max
                        </Button>
                    </div>
                </div>
                <Input
                    label="Memo (optional)"
                    placeholder="Transaction memo"
                    value={memo}
                    onValueChange={setMemo}
                    variant="bordered"
                    isDisabled={isProcessing}
                />
                <div className="flex items-center justify-between text-sm">
                    <span>Estimated fee</span>
                    <div className="flex items-center gap-2">
                        <div>{feeGnk.toFixed(6)} GNK</div>
                        <Button
                            size="sm"
                            isIconOnly
                            variant="light"
                            onPress={() => setIsFeeSettingsOpen(!isFeeSettingsOpen)}
                        >
                            <HiCog8Tooth className="w-5 h-5 text-zinc-400" />
                        </Button>
                    </div>
                </div>

                {isFeeSettingsOpen && (
                    <div className="flex flex-col gap-2">
                        <Input
                            label="Gas limit"
                            type="number"
                            value={gasLimitInput}
                            onValueChange={setGasLimitInput}
                            min={1}
                            variant="bordered"
                            isDisabled={isProcessing}
                        />
                        <Input
                            label="Gas price (ngonka)"
                            type="number"
                            value={gasPriceInput}
                            onValueChange={setGasPriceInput}
                            min={0}
                            variant="bordered"
                            isDisabled={isProcessing}
                        />
                    </div>
                )}
                {error && (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
                        {error}
                    </div>
                )}

                {status === "success" && transactionHash && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-sm text-success">
                        <div className="font-semibold mb-1">Transaction successful!</div>
                        <div className="text-xs break-all">Hash: {transactionHash}</div>
                    </div>
                )}

                {isProcessing && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <Spinner size="sm" />
                        <span className="text-sm">
                            {status === "signing" && "Signing transaction..."}
                            {status === "broadcasting" && "Broadcasting transaction..."}
                            {status === "pending" && "Waiting for confirmation..."}
                        </span>
                    </div>
                )}
            </SheetBody>
            <SheetFooter>
                <Button
                    color="primary"
                    className="w-full"
                    onPress={handleSend}
                    isDisabled={!canSend}
                    isLoading={isProcessing}
                >
                    {isProcessing ? "Processing..." : "Send"}
                </Button>
            </SheetFooter>
        </Sheet>
    );
};
