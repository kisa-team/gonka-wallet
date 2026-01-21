"use client";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/Sheet";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const ScanQRSheet: FC = () => {
    const isOpen = useWalletStore((s) => s.sheets.scanQR);
    const closeSheet = useWalletStore((s) => s.closeSheet);
    const walletConnectService = useWalletStore((s) => s.walletConnectService);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrReaderRef = useRef<HTMLDivElement>(null);
    const [qrReaderReady, setQrReqderReady] = useState(false);

    const qrReaderCallbackRef = useCallback((node: HTMLDivElement | null) => {
        qrReaderRef.current = node;
        setQrReqderReady(!!node);
    }, []);

    const startScanning = useCallback(async () => {
        const qrReader = qrReaderRef.current;
        if (!walletConnectService || !qrReader) {
            return;
        }

        try {
            if (scannerRef.current) {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            }
        } catch (err) {}

        try {
            const scanner = new Html5Qrcode(qrReader.id, {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: true,
            });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    if (decodedText.startsWith("wc:")) {
                        scanner.stop().then(() => {
                            scanner.clear();
                            scannerRef.current = null;
                            closeSheet("scanQR");
                            walletConnectService.onConnection(decodedText);
                        });
                    } else {
                        setError("Invalid Wallet Connect QR code");
                    }
                },
                () => {}
            );

            setError(null);
        } catch (err: any) {
            console.error("QR Scanner error:", err);
            let errorMessage =
                err instanceof Error ? err.message : String(err) || "Failed to start camera";
            if (errorMessage.includes("NotFoundError")) {
                errorMessage = "Camera not found";
            } else if (errorMessage.includes("NotAllowedError")) {
                errorMessage = "Camera not allowed";
            }
            setError(errorMessage);
        }
    }, [walletConnectService, closeSheet]);

    const stopScanning = useCallback(async () => {
        const scanner = scannerRef.current;
        if (scanner) {
            try {
                await scanner.stop();
                scanner.clear();
                scannerRef.current = null;
            } catch (err) {}
        }
        setError(null);
    }, []);

    useEffect(() => {
        if (isOpen && qrReaderReady) {
            startScanning();
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [isOpen, qrReaderReady, startScanning, stopScanning]);

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("scanQR", open)}
            side="bottom"
            parentSelector="#screens"
            overlayBlur={true}
        >
            <SheetHeader>Scan QR Code</SheetHeader>
            <SheetBody className="flex flex-col gap-4 h-full">
                <div className="flex flex-col items-center gap-4">
                    {error && <div className="text-sm text-danger text-center">{error}</div>}
                    {!error && (
                        <div className="text-sm text-default-400 text-center">
                            Point your camera at a Wallet Connect QR code
                        </div>
                    )}
                    <div
                        ref={qrReaderCallbackRef}
                        id="qr-reader"
                        className="w-full h-full relative"
                    />
                </div>
            </SheetBody>
        </Sheet>
    );
};
