"use client";
import { addToast, Button } from "@heroui/react";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { useErrorToast } from "@/src/utils/error-helpers";
import type { WCSEventCosmosSignAmino } from "@/src/utils/wallet-connect-service/WalletConnectServiceEvents";

export const SignMessageSheet: FC = () => {
    const walletConnectService = useWalletStore((s) => s.walletConnectService);
    const [isOpen, setIsOpen] = useState(false);
    const [requestData, setRequestData] = useState<WCSEventCosmosSignAmino | null>(null);
    const showErrorToast = useErrorToast();

    useEffect(() => {
        if (!walletConnectService) {
            return;
        }

        const listener = walletConnectService.events.on("cosmosSignAmino", (data) => {
            if (data) {
                setRequestData(data);
                setIsOpen(true);
            }
        });

        return () => {
            listener.destroy();
        };
    }, [walletConnectService]);

    const handleApprove = useCallback(async () => {
        if (!requestData) return;

        try {
            await requestData.approve();
            addToast({
                title: "Approved",
                color: "success",
                timeout: 3000,
            });
        } catch (error) {
            showErrorToast(error);
        }
        setIsOpen(false);
    }, [requestData, showErrorToast]);

    const handleReject = useCallback(async () => {
        if (!requestData) return;

        try {
            await requestData.reject();
        } catch (error) {
            showErrorToast(error);
        }
        setIsOpen(false);
    }, [requestData, showErrorToast]);

    const message = useMemo(() => {
        return atob(requestData?.signDoc.msgs[0].value.data || "");
    }, [requestData]);
    const chainId = useMemo(() => requestData?.signDoc.chainId || "", [requestData]);
    const signerAddress = useMemo(() => requestData?.signerAddress || "", [requestData]);

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    handleReject();
                }
            }}
            dismissible={false}
            parentSelector="#screens"
            side="bottom"
            contentFit="content"
            overlayBlur={true}
        >
            <SheetHeader>Sign message</SheetHeader>
            <SheetBody className="flex flex-col gap-4 p-4 break-words">
                <div className="flex flex-col">
                    <div className="text-sm text-default-400">Signer address</div>
                    <div>{signerAddress}</div>
                </div>

                <div className="flex flex-col">
                    <div className="text-sm text-default-400">Chain ID</div>
                    <div>{chainId}</div>
                </div>
                <div className="flex flex-col">
                    <div className="text-sm text-default-400 mb-1">Message</div>
                    <div className="text-sm">{message}</div>
                </div>
            </SheetBody>
            <SheetFooter className="flex justify-between gap-2">
                <Button variant="bordered" onPress={handleReject} color="danger">
                    Reject
                </Button>
                <Button color="primary" onPress={handleApprove}>
                    Approve
                </Button>
            </SheetFooter>
        </Sheet>
    );
};
