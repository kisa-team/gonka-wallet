import { Button } from "@heroui/react";
import type { FC } from "react";
import { MdContentCopy, MdLogout } from "react-icons/md";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useCopyTextToClipboard } from "@/hooks/useCopyTextToClipboard";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const WalletSettingsSheet: FC = () => {
    const seedPhrase = useWalletStore((s) => s.seedPhrase);
    const isOpen = useWalletStore((s) => s.sheets.settings);
    const copyTextToClipboard = useCopyTextToClipboard();

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("settings", open)}
            side="right"
            parentSelector="#screens"
        >
            <SheetHeader>Settings</SheetHeader>
            <SheetBody className="px-4">
                <div className="flex flex-col gap-4 mx-auto w-fit">
                    <Button
                        variant="bordered"
                        startContent={<MdContentCopy />}
                        onPress={() => copyTextToClipboard(seedPhrase)}
                    >
                        Copy seed phrase
                    </Button>
                    <Button
                        variant="bordered"
                        startContent={<MdLogout />}
                        onPress={() => {
                            useWalletStore.getState().resetSeedPhrase();
                            useWalletStore.getState().closeSheet("settings");
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </SheetBody>
            <SheetFooter>
                <div />
            </SheetFooter>
        </Sheet>
    );
};
