import { type FC, useEffect } from "react";
import { ConnectWalletSheet } from "@/components/wallet/sheets/wallet/ConnectWalletSheet";
import { CreateWalletSheet } from "@/components/wallet/sheets/wallet/create-wallet-sheet/CreateWalletSheet";
import { GrantPermissionsSheet } from "@/components/wallet/sheets/wallet/grant-permissions/GrantPermissionsSheet";
import { ImportSeedPhraseSheet } from "@/components/wallet/sheets/wallet/ImportSeedPhraseSheet";
import { ProposalsSheet } from "@/components/wallet/sheets/wallet/ProposalsSheet";
import { ReceiveSheet } from "@/components/wallet/sheets/wallet/ReceiveSheet";
import { ScanQRSheet } from "@/components/wallet/sheets/wallet/ScanQRSheet";
import { SendSheet } from "@/components/wallet/sheets/wallet/SendSheet";
import { SignMessageSheet } from "@/components/wallet/sheets/wallet/SignMessageSheet";
import { SignTransactionSheet } from "@/components/wallet/sheets/wallet/SignTransactionSheet";
import { ValidatorsSheet } from "@/components/wallet/sheets/wallet/stake-sheet/ValidatorsSheet";
import { TokenSheet } from "@/components/wallet/sheets/wallet/TokenSheet";
import { WalletSettingsSheet } from "@/components/wallet/sheets/wallet/WalletSettingsSheet";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { openLinkHelper } from "@/src/utils/share";

export const Wallet: FC = () => {
    const rpcClient = useWalletStore((state) => state.rpcClient);
    const userWallet = useWalletStore((state) => state.userWallet);
    const walletConnectService = useWalletStore((state) => state.walletConnectService);

    useEffect(() => {
        useWalletStore.getState().loadSeedPhrase();
        useWalletStore.getState().initializeWalletConnectService();

        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === "open_link" && event.data?.payload?.url) {
                openLinkHelper(event.data.payload.url);
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    useEffect(() => {
        if (!walletConnectService) {
            return;
        }

        walletConnectService.setWallet(userWallet);
    }, [walletConnectService, userWallet]);

    useEffect(() => {
        if (userWallet && !rpcClient) {
            useWalletStore.getState().initRpcClient();
        }
    }, [userWallet, rpcClient]);

    useEffect(() => {
        if (userWallet && rpcClient) {
            useWalletStore.getState().updateTokens();
        }
    }, [userWallet, rpcClient]);

    return (
        <>
            <CreateWalletSheet />
            <ImportSeedPhraseSheet />
            <WalletSettingsSheet />
            <SendSheet />
            <ReceiveSheet />
            <ConnectWalletSheet />
            <ScanQRSheet />
            <SignMessageSheet />
            <SignTransactionSheet />
            <ValidatorsSheet />
            <GrantPermissionsSheet />
            <ProposalsSheet />
            <TokenSheet />
        </>
    );
};
