"use client";
import { Alert, addToast, Button } from "@heroui/react";
import protobuf from "protobufjs";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { useErrorToast } from "@/src/utils/error-helpers";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";
import type { WCSEventCosmosSignDirect } from "@/src/utils/wallet-connect-service/WalletConnectServiceEvents";

const PROTO_DEFINITIONS = {
    any: `
        syntax = "proto3";
        package google.protobuf;
        message Any {
            string type_url = 1;
            bytes value = 2;
        }
    `,
    coin: `
        syntax = "proto3";
        package cosmos.base.v1beta1;
        message Coin {
            string denom = 1;
            string amount = 2;
        }
    `,
    txBody: `
        syntax = "proto3";
        package cosmos.tx.v1beta1;
        import "google/protobuf/any.proto";
        message TxBody {
            repeated google.protobuf.Any messages = 1;
            string memo = 2;
            uint64 timeout_height = 3;
            repeated google.protobuf.Any extension_options = 1023;
            repeated google.protobuf.Any non_critical_extension_options = 2047;
        }
    `,
    msgSend: `
        syntax = "proto3";
        package cosmos.bank.v1beta1;
        import "cosmos/base/v1beta1/coin.proto";
        message MsgSend {
            string from_address = 1;
            string to_address = 2;
            repeated cosmos.base.v1beta1.Coin amount = 3;
        }
    `,
};

export const SignTransactionSheet: FC = () => {
    const walletConnectService = useWalletStore((s) => s.walletConnectService);
    const [isOpen, setIsOpen] = useState(false);
    const [requestData, setRequestData] = useState<WCSEventCosmosSignDirect | null>(null);
    const showErrorToast = useErrorToast();
    const [transferInfo, setTransferInfo] = useState<{
        from: string;
        to: string;
        amount: string;
        denom: string;
    } | null>(null);

    useEffect(() => {
        if (!walletConnectService) {
            return;
        }

        const listener = walletConnectService.events.on("cosmosSignDirect", (data) => {
            if (data) {
                setRequestData(data);
                setIsOpen(true);
            }
        });

        return () => {
            listener.destroy();
        };
    }, [walletConnectService]);

    useEffect(() => {
        if (!requestData) {
            return;
        }

        const parseTransferInfo = async (signDoc: any) => {
            try {
                if (!signDoc?.bodyBytes) {
                    return null;
                }

                const bodyBytes = signDoc.bodyBytes;
                let bodyBytesArray: Uint8Array;

                if (Array.isArray(bodyBytes)) {
                    bodyBytesArray = new Uint8Array(bodyBytes);
                } else if (typeof bodyBytes === "string") {
                    try {
                        bodyBytesArray = Uint8Array.from(atob(bodyBytes), (c) => c.charCodeAt(0));
                    } catch {
                        return null;
                    }
                } else {
                    bodyBytesArray = bodyBytes;
                }

                const root = new protobuf.Root();
                protobuf.parse(PROTO_DEFINITIONS.any, root, { keepCase: true });
                protobuf.parse(PROTO_DEFINITIONS.coin, root, { keepCase: true });
                protobuf.parse(PROTO_DEFINITIONS.txBody, root, { keepCase: true });
                protobuf.parse(PROTO_DEFINITIONS.msgSend, root, { keepCase: true });

                const TxBody = root.lookupType("cosmos.tx.v1beta1.TxBody");
                const decoded = TxBody.decode(bodyBytesArray);
                const messages = (decoded as any).messages || [];

                for (const msg of messages) {
                    const typeUrl = msg.typeUrl || msg.type_url;

                    if (typeUrl === "/cosmos.bank.v1beta1.MsgSend" && msg.value) {
                        const MsgSend = root.lookupType("cosmos.bank.v1beta1.MsgSend");
                        const sendMsg = MsgSend.decode(msg.value);

                        const fromAddress = (sendMsg as any).from_address || "";
                        const toAddress = (sendMsg as any).to_address || "";
                        const amounts = (sendMsg as any).amount || [];

                        for (const amount of amounts) {
                            const denom = amount.denom || "";
                            const amountValue = amount.amount || "0";

                            if (denom === "ngonka") {
                                const gnkAmount = (
                                    Number.parseInt(amountValue, 10) / GonkaWallet.NGONKA_TO_GONKA
                                ).toFixed(6);

                                return {
                                    from: fromAddress,
                                    to: toAddress,
                                    amount: gnkAmount,
                                    denom: "GNK",
                                };
                            }

                            showErrorToast(new Error(`Unsupported denom: ${denom}`), true);
                        }
                    }
                }
            } catch {}
            return null;
        };

        parseTransferInfo(requestData.signDoc)
            .then(setTransferInfo)
            .catch(() => setTransferInfo(null));
    }, [requestData, showErrorToast]);

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
            <SheetHeader>Transaction approval</SheetHeader>
            <SheetBody className="flex flex-col gap-4 p-4 break-words">
                <div className="flex flex-col">
                    <div className="text-sm text-default-400">From</div>
                    <div>{transferInfo?.from}</div>
                </div>
                <div className="flex flex-col">
                    <div className="text-sm text-default-400">To</div>
                    <div>{transferInfo?.to}</div>
                </div>
                <div className="flex flex-col">
                    <div className="text-sm text-default-400">Amount</div>
                    <div>
                        {transferInfo?.amount} {transferInfo?.denom}
                    </div>
                </div>
                <Alert color="primary" variant="bordered" className="text-sm">
                    Check the transaction details before approval. After signing, the transaction
                    may be sent to the network
                </Alert>
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
