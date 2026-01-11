"use client";
import { addToast, Button, Image } from "@heroui/react";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useWalletConnectService } from "@/hooks/wallet/useWalletConnectService";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { useErrorToast } from "@/src/utils/error-helpers";
import type { WCSEventSessionProposal } from "@/src/utils/wallet-connect-service/WalletConnectServiceEvents";

export const ConnectWalletSheet: FC = () => {
    useWalletConnectService();

    const userWallet = useWalletStore((s) => s.userWallet);
    const walletConnectService = useWalletStore((s) => s.walletConnectService);
    const [isOpen, setIsOpen] = useState(false);
    const [proposalData, setProposalData] = useState<WCSEventSessionProposal | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const showErrorToast = useErrorToast();

    useEffect(() => {
        if (!walletConnectService || !userWallet) {
            return;
        }

        const listener = walletConnectService.events.on("sessionProposal", async (data) => {
            setProposalData(data ?? null);
            setIsOpen(true);
        });

        return () => {
            listener.destroy();
        };
    }, [walletConnectService, userWallet]);

    const onClickConnect = useCallback(async () => {
        if (!proposalData || !userWallet) {
            return;
        }

        setIsLoading(true);
        try {
            await proposalData.approve({ address: userWallet.account.address });
            addToast({
                title: "Connected",
                color: "success",
                timeout: 1000,
            });
        } catch (error: any) {
            showErrorToast(error, "Connection error");
        }
        setIsLoading(false);
        setIsOpen(false);
    }, [proposalData, userWallet, showErrorToast]);

    const onClickReject = useCallback(async () => {
        if (!proposalData) {
            return;
        }

        try {
            await proposalData.reject();
        } catch (error) {
            showErrorToast(error);
        }
        setIsOpen(false);
    }, [proposalData, showErrorToast]);

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClickReject();
                }
            }}
            side="bottom"
            parentSelector="#screens"
            dismissible={false}
            contentFit="content"
            overlayBlur={true}
        >
            {proposalData && (
                <>
                    <SheetHeader>Connect Wallet</SheetHeader>
                    <SheetBody className="flex flex-col gap-4 px-4 py-4">
                        <div className="flex flex-col items-center m-auto text-center">
                            {proposalData.proposal.params.proposer.metadata.icons?.[0] && (
                                <Image
                                    src={proposalData.proposal.params.proposer.metadata.icons[0]}
                                    alt={proposalData.proposal.params.proposer.metadata.name}
                                    className="w-32 h-32 rounded-2xl mb-6"
                                />
                            )}
                            <div className="text-xl font-semibold">
                                {proposalData.proposal.params.proposer.metadata.name}
                            </div>
                            <div>requests connection to your wallet</div>
                            <div className="text-xs text-default-400 mt-6">
                                After connecting, you will be able to use your wallet in this
                                application.
                            </div>
                        </div>
                    </SheetBody>
                    <SheetFooter className="flex justify-between">
                        <Button variant="bordered" onPress={onClickReject} isDisabled={isLoading}>
                            Close
                        </Button>
                        <Button
                            color={"primary"}
                            onPress={onClickConnect}
                            isDisabled={isLoading}
                            isLoading={isLoading}
                        >
                            Connect
                        </Button>
                    </SheetFooter>
                </>
            )}
        </Sheet>
    );
};
