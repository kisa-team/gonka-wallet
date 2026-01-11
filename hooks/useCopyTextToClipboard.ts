"use client";
import { addToast } from "@heroui/react";
import { copyTextToClipboard, isTMA } from "@tma.js/sdk";
import { useCallback } from "react";
import { useErrorToast } from "@/src/utils/error-helpers";

export function copyTextToClipboardHelper(
    text: string,
    message: string = "Copied to clipboard",
    onError?: (error: any) => void
) {
    const func = (t: string) =>
        isTMA() ? copyTextToClipboard(t) : navigator.clipboard.writeText(t);
    func(text)
        .then(() => {
            addToast({
                title: message,
                color: "success",
                timeout: 1000,
            });
        })
        .catch((e) => {
            if (onError) {
                onError(e);
            } else {
                console.error("Failed to copy to clipboard:", e);
                addToast({
                    title: "Failed to copy",
                    color: "danger",
                    timeout: 1000,
                });
            }
        });
}

export const useCopyTextToClipboard = () => {
    const showErrorToast = useErrorToast();

    return useCallback(
        (text: string, message: string = "Copied to clipboard") => {
            copyTextToClipboardHelper(text, message, showErrorToast);
        },
        [showErrorToast]
    );
};
