import type { FC } from "react";
import { AppsScreen } from "@/components/wallet/screens/apps/AppsScreen";
import { HistoryScreen } from "@/components/wallet/screens/history/HistoryScreen";
import { LoadingScreen } from "@/components/wallet/screens/main/LoadingScreen";
import { WelcomeScreen } from "@/components/wallet/screens/main/WelcomeScreen";
import { useWalletStore, WalletScreen } from "@/hooks/wallet/useWalletStore";
import { MainScreen } from "./main/MainScreen";

export const Screens: FC = () => {
    const screen = useWalletStore((state) => state.screen);

    let ScreenFC: FC;
    switch (screen) {
        case WalletScreen.LOADING:
            ScreenFC = LoadingScreen;
            break;
        case WalletScreen.WELCOME:
            ScreenFC = WelcomeScreen;
            break;
        case WalletScreen.MAIN:
            ScreenFC = MainScreen;
            break;
        case WalletScreen.HISTORY:
            ScreenFC = HistoryScreen;
            break;
        case WalletScreen.APPS:
            ScreenFC = AppsScreen;
            break;
        default:
            ScreenFC = MainScreen;
            break;
    }

    return (
        <div
            id="screens"
            className="flex flex-col w-full h-full overflow-hidden relative flex-1 min-h-0"
            style={{ transform: "translateZ(0)" }}
        >
            <ScreenFC />
        </div>
    );
};
