"use client";
import { Button, Card, CardBody, Image, Spinner } from "@heroui/react";
import type { FC } from "react";
import {
    PiCoins,
    PiCurrencyDollar,
    PiHandDeposit,
    PiHandWithdraw,
    PiKey,
    PiQrCode,
    PiScroll,
} from "react-icons/pi";
import { LogoSvg } from "@/components/svg/LogoSvg";
import { GonkaWalletSettingsButton } from "@/components/wallet/screens/main/GonkaWalletSettingsButton";
import { useCopyTextToClipboard } from "@/hooks/useCopyTextToClipboard";
import { useWebApp } from "@/hooks/wallet/apps/useWebApp";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { StringUtils } from "@/src/utils/StringUtils";
import ValueUtils from "@/src/utils/ValueUtils";

export const MainScreen: FC = () => {
    const balanceGonka = useWalletStore((state) => state.balanceGonka);
    const priceGonka = useWalletStore((state) => state.priceGonka);
    const isBalanceLoading = useWalletStore((state) => state.isBalanceLoading);
    const userWallet = useWalletStore((state) => state.userWallet);
    const copyTextToClipboard = useCopyTextToClipboard();
    const { data: webApp } = useWebApp("hex");

    return (
        <div className="flex flex-col gap-6 p-3 pb-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6 gap-2">
                {userWallet && (
                    <Button
                        variant="bordered"
                        startContent={<LogoSvg className="w-6 h-6 text-zinc-400" />}
                        onPress={() =>
                            copyTextToClipboard(userWallet.account.address, "Address copied")
                        }
                    >
                        {StringUtils.truncateCenter(userWallet.account.address, 10)}
                    </Button>
                )}
                <div className="flex items-center gap-2">
                    <GonkaWalletSettingsButton />
                </div>
            </div>
            <div className="flex flex-col items-center">
                <div className="text-center text-2xl">
                    ${ValueUtils.formatMoney(balanceGonka * priceGonka)}
                </div>
                <div className="text-sm text-zinc-400 h-5">
                    {isBalanceLoading && (
                        <div className="flex items-center gap-1">
                            Updating
                            <Spinner size="sm" color="default" />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-4 gap-1 w-fit mx-auto">
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        onPress={() => useWalletStore.getState().openSheet("send")}
                    >
                        <PiHandDeposit className="w-6 h-6" />
                        Send
                    </Button>
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        onPress={() => useWalletStore.getState().openSheet("receive")}
                    >
                        <PiHandWithdraw className="w-6 h-6" />
                        Receive
                    </Button>
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        onPress={() =>
                            useWalletStore.getState().setSelectedAppId(webApp?.id ?? null)
                        }
                        isDisabled={!webApp}
                    >
                        <PiCurrencyDollar className="w-6 h-6" />
                        Buy
                    </Button>
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        isDisabled
                        onPress={() => useWalletStore.getState().openSheet("validators")}
                    >
                        <PiCoins className="w-6 h-6" />
                        Stake
                    </Button>
                </div>
                <div className="grid grid-cols-4 gap-1 w-fit mx-auto">
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        onPress={() => useWalletStore.getState().openSheet("grantMLOps")}
                    >
                        <PiKey className="w-6 h-6" />
                        Grant ML
                    </Button>
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        onPress={() => useWalletStore.getState().openSheet("proposals")}
                    >
                        <PiScroll className="w-6 h-6" />
                        Proposals
                    </Button>
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        onPress={() => useWalletStore.getState().openSheet("scanQR")}
                    >
                        <PiQrCode className="w-6 h-6" />
                        Scan QR
                    </Button>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-zinc-400">Tokens</div>
                <div className="flex flex-col gap-2">
                    <Card shadow="none" className="bg-zinc-800/50">
                        <CardBody>
                            <div className="flex gap-2">
                                <div className="w-12 h-12 bg-white aspect-square rounded-full">
                                    <Image
                                        src="/images/gonka/logo.svg"
                                        alt="Gonka"
                                        className="w-12 h-12 aspect-square"
                                    />
                                </div>
                                <div className="flex flex-col w-full">
                                    <div>Gonka</div>
                                    <div className="text-sm text-zinc-400">
                                        ${ValueUtils.formatMoney(priceGonka)}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <div>${ValueUtils.formatMoney(balanceGonka * priceGonka)}</div>
                                    <div className="text-sm text-zinc-400 shrink-0">
                                        {balanceGonka} GNK
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};
