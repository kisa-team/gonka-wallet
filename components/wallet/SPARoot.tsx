import type { FC } from "react";
import { Providers } from "@/components/wallet/Providers";
import { Screens } from "@/components/wallet/screens/Screens";
import { AppSheet } from "@/components/wallet/sheets/app/AppSheet";
import { Wallet } from "@/components/wallet/sheets/wallet/Wallet";
import { useGlobalInputListener } from "@/hooks/useGlobalInputListener";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { Menu } from "./Menu";

export const SPARoot: FC = () => {
    useVisualViewport();
    useGlobalInputListener();

    return (
        <Providers>
            <div className="w-full h-full overflow-hidden">
                <div
                    id="screens"
                    className="w-full h-full flex flex-col max-w-2xl mx-auto relative overflow-hidden min-h-0"
                >
                    <Screens />
                    <Menu />
                    <Wallet />
                    <AppSheet />
                </div>
            </div>
        </Providers>
    );
};
