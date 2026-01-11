import { Button } from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import type { FC } from "react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useCopyTextToClipboard } from "@/hooks/useCopyTextToClipboard";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const ReceiveSheet: FC = () => {
    const isOpen = useWalletStore((s) => s.sheets.receive);
    const copyTextToClipboard = useCopyTextToClipboard();
    const userWallet = useWalletStore((state) => state.userWallet);
    if (!userWallet) {
        return null;
    }

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("receive", open)}
            side="bottom"
            parentSelector="#screens"
        >
            <SheetHeader>Receive</SheetHeader>
            <SheetBody className="flex flex-col items-center gap-4 px-4">
                <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={userWallet.account.address} size={200} />
                </div>
                <div className="text-sm flex-1 break-all">{userWallet.account.address}</div>
            </SheetBody>
            <SheetFooter>
                <Button
                    className="w-full"
                    color="primary"
                    onPress={() =>
                        copyTextToClipboard(userWallet.account.address, "Address copied")
                    }
                >
                    Copy address
                </Button>
            </SheetFooter>
        </Sheet>
    );
};
