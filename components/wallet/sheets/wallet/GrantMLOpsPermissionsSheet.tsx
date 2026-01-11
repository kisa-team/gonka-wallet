"use client";
import { addToast, Button, Input, Spinner } from "@heroui/react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { HiCog8Tooth } from "react-icons/hi2";
import { PiShareFat } from "react-icons/pi";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useStartParams } from "@/hooks/useStartParams";
import type { GrantPermissionsOptions } from "@/hooks/wallet/useGrantMLOpsPermissions";
import {
    DEFAULT_GAS_LIMIT_GRANT,
    DEFAULT_GAS_PRICE_GRANT,
    useGrantMLOpsPermissions,
} from "@/hooks/wallet/useGrantMLOpsPermissions";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { shareApp } from "@/src/utils/share";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";
export const GrantMLOpsPermissionsSheet: FC = () => {
    const userWallet = useWalletStore((state) => state.userWallet);
    const balanceGonka = useWalletStore((state) => state.balanceGonka);
    const [mlOperationalAddress, setMLOperationalAddress] = useState<string>("");
    const [expirationDays, setExpirationDays] = useState<string>("30");
    const [gasLimitInput, setGasLimitInput] = useState<string>(DEFAULT_GAS_LIMIT_GRANT.toString());
    const [gasPriceInput, setGasPriceInput] = useState<string>(
        DEFAULT_GAS_PRICE_GRANT.replace("ngonka", "")
    );
    const [isFeeSettingsOpen, setIsFeeSettingsOpen] = useState<boolean>(false);

    const { grantPermissions, status, transactionHash, error, reset } = useGrantMLOpsPermissions();
    const isOpen = useWalletStore((s) => s.sheets.grantMLOps);

    const startAppParams = useStartParams();

    useEffect(() => {
        if (startAppParams.mlOpAddress) {
            setMLOperationalAddress(startAppParams.mlOpAddress);
            useWalletStore.getState().openSheet("grantMLOps");
        }
    }, [startAppParams.mlOpAddress]);

    useEffect(() => {
        if (status === "success") {
            addToast({
                title: "Permissions granted successfully",
                color: "success",
                timeout: 5000,
            });
            setTimeout(() => {
                reset();
                useWalletStore.getState().closeSheet("grantMLOps");
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
                : DEFAULT_GAS_LIMIT_GRANT;

        const parsedGasPrice = Number.parseFloat(gasPriceInput);
        const gasPriceValue =
            Number.isFinite(parsedGasPrice) && parsedGasPrice >= 0 ? parsedGasPrice : 0.1;
        const gasPriceString = `${gasPriceValue}ngonka`;

        const feeNgonka = gasLimit * gasPriceValue;
        const feeGnk = feeNgonka / GonkaWallet.NGONKA_TO_GONKA;

        return { gasLimit, gasPriceString, feeGnk };
    };

    const handleGrant = async () => {
        if (!GonkaWallet.isValidGonkaAddress(mlOperationalAddress)) {
            addToast({
                title: "Invalid ML operational address",
                color: "danger",
                timeout: 3000,
            });
            return;
        }

        const expirationDaysNum = Number.parseInt(expirationDays, 10);
        if (Number.isNaN(expirationDaysNum) || expirationDaysNum <= 0) {
            addToast({
                title: "Invalid expiration days",
                color: "danger",
                timeout: 3000,
            });
            return;
        }

        const { gasLimit, gasPriceString, feeGnk } = parseGasSettings();
        console.log(feeGnk);
        if (feeGnk > balanceGonka) {
            addToast({
                title: "Not enough balance for fee",
                color: "danger",
                timeout: 3000,
            });
            return;
        }

        const options: GrantPermissionsOptions = {
            gasLimit,
            gasPrice: gasPriceString,
            expirationDays: expirationDaysNum,
        };

        await grantPermissions(mlOperationalAddress, options);
    };

    const isProcessing = status === "signing" || status === "broadcasting" || status === "pending";
    const canGrant =
        !isProcessing &&
        mlOperationalAddress &&
        GonkaWallet.isValidGonkaAddress(mlOperationalAddress);
    const { feeGnk } = parseGasSettings();

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("grantMLOps", open)}
            side="bottom"
            parentSelector="#screens"
        >
            <SheetHeader>Grant ML Ops Permissions</SheetHeader>
            <SheetBody className="flex flex-col gap-4 px-4">
                <div className="text-sm text-zinc-400">
                    Grant ML operational permissions to allow another address to perform ML
                    operations on behalf of your account.
                </div>
                <Input
                    label="ML Operational Address"
                    placeholder="gonka1..."
                    value={mlOperationalAddress}
                    onValueChange={setMLOperationalAddress}
                    variant="bordered"
                    isDisabled={isProcessing}
                    isInvalid={
                        mlOperationalAddress !== "" &&
                        !GonkaWallet.isValidGonkaAddress(mlOperationalAddress)
                    }
                    errorMessage={
                        mlOperationalAddress !== "" &&
                        !GonkaWallet.isValidGonkaAddress(mlOperationalAddress)
                            ? "Invalid Gonka address"
                            : undefined
                    }
                />
                <Input
                    label="Expiration (days)"
                    placeholder="365"
                    type="number"
                    value={expirationDays}
                    onValueChange={setExpirationDays}
                    variant="bordered"
                    isDisabled={isProcessing}
                    min={1}
                    description="Permissions will expire after this many days"
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
                        <div className="font-semibold mb-1">Permissions granted successfully!</div>
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
            <SheetFooter className="flex items-center gap-2">
                <Button
                    variant="bordered"
                    isIconOnly
                    onPress={() => shareApp({ mlOpAddress: mlOperationalAddress })}
                    className="text-zinc-400"
                >
                    <PiShareFat className="w-6 h-6" />
                </Button>

                <Button
                    color="primary"
                    className="w-full"
                    onPress={handleGrant}
                    isDisabled={!canGrant}
                    isLoading={isProcessing}
                >
                    {isProcessing ? "Processing..." : "Grant Permissions"}
                </Button>
            </SheetFooter>
        </Sheet>
    );
};
