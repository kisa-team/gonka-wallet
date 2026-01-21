"use client";
import { Button } from "@heroui/react";
import type { FC } from "react";
import {
    PiCoins,
    PiCurrencyDollar,
    PiHandDeposit,
    PiHandWithdraw,
    PiKey,
    PiQrCode,
    PiScroll,
    PiSwap,
} from "react-icons/pi";
import { LogoSvg } from "@/components/svg/LogoSvg";
import { GonkaWalletSettingsButton } from "@/components/wallet/screens/main/GonkaWalletSettingsButton";
import { Tokens } from "@/components/wallet/screens/main/Tokens";
import { TotalBalanceUSD } from "@/components/wallet/screens/main/TotalBalanceUSD";
import { useCopyTextToClipboard } from "@/hooks/useCopyTextToClipboard";
import { useWebApp } from "@/hooks/wallet/apps/useWebApp";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { StringUtils } from "@/src/utils/StringUtils";

export const MainScreen: FC = () => {
    const userWallet = useWalletStore((state) => state.userWallet);
    const copyTextToClipboard = useCopyTextToClipboard();
    const { data: hexApp } = useWebApp("hex");
    const { data: onyxApp } = useWebApp("onyx");

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
            <TotalBalanceUSD />
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
                            useWalletStore.getState().setSelectedAppId(hexApp?.id ?? null)
                        }
                        isDisabled={!hexApp}
                    >
                        <PiCurrencyDollar className="w-6 h-6" />
                        Buy
                    </Button>
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        onPress={() =>
                            useWalletStore.getState().setSelectedAppId(onyxApp?.id ?? null)
                        }
                        isDisabled={!onyxApp}
                    >
                        <PiSwap className="w-6 h-6" />
                        Swap
                    </Button>
                </div>
                <div className="grid grid-cols-4 gap-1 w-fit mx-auto">
                    <Button
                        variant="light"
                        className="flex flex-col items-center justify-center h-auto p-2 text-xs gap-1"
                        isDisabled
                        onPress={() => useWalletStore.getState().openSheet("validators")}
                    >
                        <PiCoins className="w-6 h-6" />
                        Stake
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
                        onPress={() => useWalletStore.getState().openSheet("grantMLOps")}
                    >
                        <PiKey className="w-6 h-6" />
                        Grant ML
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
            <Tokens />
        </div>
    );
};
