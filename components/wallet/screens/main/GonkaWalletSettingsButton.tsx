"use client";
import { Button } from "@heroui/react";
import type { FC } from "react";
import { PiGear } from "react-icons/pi";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const GonkaWalletSettingsButton: FC = () => {
    const hasLocalSeedPhrase = useWalletStore((state) => !!state.seedPhrase);

    return (
        <>
            {hasLocalSeedPhrase && (
                <Button
                    isIconOnly
                    variant="bordered"
                    onPress={() => useWalletStore.getState().openSheet("settings")}
                >
                    <PiGear className="w-6 h-6 text-zinc-400" />
                </Button>
            )}
        </>
    );
};
