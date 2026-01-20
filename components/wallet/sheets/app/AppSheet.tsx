import { Button, Spinner } from "@heroui/react";
import { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaLock } from "react-icons/fa6";
import { IoReloadOutline, IoShareOutline, IoWarningOutline } from "react-icons/io5";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/Sheet";
import { useStartParams } from "@/hooks/useStartParams";
import { useWebApp } from "@/hooks/wallet/apps/useWebApp";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { shareApp } from "@/src/utils/share";

type LoadingStatus = "idle" | "checking" | "loading" | "loaded" | "error";

const LOAD_TIMEOUT_MS = 30000;
// const FETCH_TIMEOUT_MS = 10000;

// async function checkUrlAvailability(url: string, signal: AbortSignal): Promise<boolean> {
//     try {
//         const response = await fetch(url, {
//             method: "HEAD",
//             mode: "no-cors",
//             signal,
//         });
//         return response.type === "opaque" || response.ok;
//     } catch {
//         return false;
//     }
// }

export const AppSheet: FC = () => {
    const startParams = useStartParams();
    const selectedAppId = useWalletStore((state) => state.selectedAppId);
    const userWallet = useWalletStore((state) => state.userWallet);
    const { data: webApp, isLoading: isLoadingWebAppData } = useWebApp(selectedAppId);

    const [status, setStatus] = useState<LoadingStatus>("idle");
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // const abortRef = useRef<AbortController | null>(null);
    const shortUrl = useMemo(() => {
        if (!webApp) {
            return "";
        }
        const url = new URL(webApp?.url || "");
        return `${url.protocol}//${url.hostname}`;
    }, [webApp]);

    const cleanup = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        // if (abortRef.current) {
        //     abortRef.current.abort();
        //     abortRef.current = null;
        // }
    }, []);

    const loadApp = useCallback(
        async (url: string) => {
            cleanup();
            setStatus("checking");
            setIframeSrc(null);

            // abortRef.current = new AbortController();
            // const timeoutId = setTimeout(() => abortRef.current?.abort(), FETCH_TIMEOUT_MS);
            // const isAvailable = await checkUrlAvailability(url, abortRef.current.signal);
            // clearTimeout(timeoutId);

            // if (!isAvailable) {
            //     setStatus("error");
            //     return;
            // }

            setTimeout(() => {
                setStatus("loading");
                setIframeSrc(url);

                timeoutRef.current = setTimeout(() => setStatus("error"), LOAD_TIMEOUT_MS);
            }, 1);
        },
        [cleanup]
    );

    useEffect(() => {
        if (!startParams.webAppId || !userWallet) {
            return;
        }
        useWalletStore.getState().setSelectedAppId(startParams.webAppId);
    }, [startParams.webAppId, userWallet]);

    useEffect(() => {
        if (!webApp && isLoadingWebAppData) {
            setStatus("loading");
        }
    }, [webApp, isLoadingWebAppData]);

    useEffect(() => {
        if (webApp) {
            loadApp(webApp.url + (startParams.webAppParams || ""));
        } else {
            cleanup();
            setStatus("idle");
            setIframeSrc(null);
        }
        return cleanup;
    }, [webApp, loadApp, cleanup, startParams.webAppParams]);

    useEffect(() => {
        if (!selectedAppId) {
            return;
        }
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === "share_app" && event.data?.payload?.params) {
                shareApp({ webAppId: selectedAppId, webAppParams: event.data.payload.params });
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [selectedAppId]);

    const handleLoad = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setStatus("loaded");
    }, []);

    const handleError = useCallback(() => {
        cleanup();
        setStatus("error");
    }, [cleanup]);

    const handleRetry = useCallback(() => {
        if (webApp) {
            loadApp(webApp.url + (startParams.webAppParams || ""));
        }
    }, [loadApp, webApp, startParams.webAppParams]);

    return (
        <Sheet
            open={!!selectedAppId}
            onOpenChange={(open) => {
                if (!open) {
                    useWalletStore.getState().setSelectedAppId(null);
                }
            }}
            side="bottom"
            parentSelector="#screens"
        >
            <SheetHeader>
                {webApp && (
                    <>
                        <div>{webApp.name}</div>
                        <div className="flex justify-center items-center gap-2 text-xs text-zinc-400">
                            <Button isIconOnly onPress={handleRetry} size="sm" variant="flat">
                                <IoReloadOutline className="w-4 h-4" />
                            </Button>

                            {shortUrl.startsWith("https://") && <FaLock className="w-3 h-3" />}
                            <div>{shortUrl}</div>
                            <Button
                                isIconOnly
                                onPress={() => shareApp({ webAppId: webApp.id })}
                                size="sm"
                                variant="flat"
                            >
                                <IoShareOutline className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                )}
            </SheetHeader>
            <SheetBody className="relative">
                {(status === "checking" || status === "loading") && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-10">
                        <Spinner size="lg" color="primary" variant="wave" />
                    </div>
                )}

                {status === "error" && (
                    <div className="absolute inset-0  flex flex-col items-center justify-center gap-4 bg-background z-10">
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <IoWarningOutline className="w-16 h-16 text-amber-500" />
                            <span className="text-base font-medium">
                                Failed to load application
                            </span>
                            <span className="text-sm text-zinc-500 text-center">
                                Check your internet connection or try again later
                            </span>
                        </div>
                        <Button
                            color="primary"
                            variant="flat"
                            startContent={<IoReloadOutline className="w-5 h-5" />}
                            onPress={handleRetry}
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {webApp && iframeSrc && (
                    <iframe
                        ref={iframeRef}
                        title={webApp.name}
                        src={iframeSrc}
                        className={`w-full h-full ${status !== "loaded" ? "invisible" : ""}`}
                        onLoad={handleLoad}
                        // onError={handleError}
                    />
                )}
            </SheetBody>
        </Sheet>
    );
};
