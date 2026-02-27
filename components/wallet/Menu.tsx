import { Button, Skeleton } from "@heroui/react";
import type { FC } from "react";
import { FaRegClock, FaRegCompass } from "react-icons/fa6";
import { GonkaNodesLogoSvg } from "@/components/svg/GonkaNodesLogoSvg";
import { LogoSvg } from "@/components/svg/LogoSvg";
import { useWebApp } from "@/hooks/wallet/apps/useWebApp";
import { useWalletStore, WalletScreen } from "@/hooks/wallet/useWalletStore";

export const Menu: FC = () => {
    const { data: webApp } = useWebApp("nodes");
    const seedPhrase = useWalletStore((state) => state.seedPhrase);
    const screen = useWalletStore((state) => state.screen);
    if (!seedPhrase) {
        return null;
    }

    const isMainScreen = screen === WalletScreen.MAIN;
    const isHistoryScreen = screen === WalletScreen.HISTORY;
    const isAppsScreen = screen === WalletScreen.APPS;

    return (
        <div className="grid grid-cols-4 bg-zinc-900 border-t border-x border-zinc-800 rounded-t-2xl z-[40] p-2">
            <Button
                className="h-full"
                variant="light"
                onPress={() => useWalletStore.setState({ screen: WalletScreen.MAIN })}
            >
                <div
                    className={`flex flex-col items-center justify-center gap-1 ${isMainScreen ? "text-zinc-100" : "text-zinc-400"}`}
                >
                    <LogoSvg className="w-6 h-6" />
                    <div className="font-medium">Wallet</div>
                </div>
            </Button>
            <Button
                className="h-full"
                variant="light"
                onPress={() => useWalletStore.setState({ screen: WalletScreen.HISTORY })}
            >
                <div
                    className={`flex flex-col items-center justify-center gap-1 ${isHistoryScreen ? "text-zinc-100" : "text-zinc-400"}`}
                >
                    <FaRegClock className="w-6 h-6" />
                    <div className="font-medium">History</div>
                </div>
            </Button>
            <Button
                className="h-full"
                variant="light"
                onPress={() => useWalletStore.setState({ screen: WalletScreen.APPS })}
            >
                <div
                    className={`flex flex-col items-center justify-center gap-1 ${isAppsScreen ? "text-zinc-100" : "text-zinc-400"}`}
                >
                    <FaRegCompass className="w-6 h-6" />
                    <div className="font-medium">Browser</div>
                </div>
            </Button>
            {!webApp && (
                <div className="flex flex-col items-center justify-center gap-1">
                    <Skeleton className="mx-auto rounded-full aspect-square w-6" />
                    <Skeleton className="mx-auto rounded-md w-20 h-5" />
                </div>
            )}
            {webApp && (
                <Button
                    className="h-full"
                    variant="light"
                    onPress={() => useWalletStore.getState().setSelectedAppId(webApp.id)}
                >
                    <div className="flex flex-col items-center justify-center gap-1 text-zinc-400">
                        {/* <AppIcon webApp={webApp} className="!w-6 !h-6 !text-sm !rounded-full" /> */}
                        <div className="w-6 h-6">
                            <GonkaNodesLogoSvg className="w-6 h-6" />
                        </div>
                        <div className="font-medium">{webApp.name}</div>
                    </div>
                </Button>
            )}
        </div>
    );
};
