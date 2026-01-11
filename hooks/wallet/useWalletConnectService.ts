import { useEffect } from "react";
import { useStartParams } from "../useStartParams";
import { useWalletStore } from "./useWalletStore";

export const useWalletConnectService = () => {
    const params = useStartParams();
    const userWallet = useWalletStore((state) => state.userWallet);
    const walletConnectService = useWalletStore((state) => state.walletConnectService);

    // Listen for wc_connect message from iframe
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === "wc_connect" && event.data?.payload?.wc) {
                console.log("wc_connect", event.data.payload.wc);
                walletConnectService?.onConnection(event.data.payload.wc);
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [walletConnectService]);

    // Set walletConnectUri from start params
    useEffect(() => {
        if (params.walletConnectUri && userWallet) {
            walletConnectService?.onConnection(params.walletConnectUri);
        }
    }, [params.walletConnectUri, userWallet, walletConnectService]);
};
