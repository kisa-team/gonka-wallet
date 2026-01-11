import { isTMA, openTelegramLink } from "@tma.js/sdk-react";
import { copyTextToClipboardHelper } from "@/hooks/useCopyTextToClipboard";
import { encodeStartAppParams, type StartAppParams } from "@/src/utils/StartAppParams";

export const shareApp = (params?: Partial<StartAppParams>, text?: string) => {
    const encodedParams = params ? encodeStartAppParams(params) : "";
    const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    const telegramTmaName = process.env.NEXT_PUBLIC_TELEGRAM_TMA_NAME;

    if (isTMA() && telegramBotUsername && telegramTmaName) {
        const url = new URL(process.env.NEXT_PUBLIC_WEBAPP_URL || window.location.origin);
        url.pathname = "/s";
        url.searchParams.append("startapp", encodedParams);

        openTelegramLink(
            `https://t.me/share/url?url=${encodeURI(url.toString())}${text ? `&text=${encodeURI(text)}` : ""}`
        );
    } else {
        shareAppWeb(encodedParams);
    }
};

function shareAppWeb(encodedParams: string) {
    const url = new URL(process.env.NEXT_PUBLIC_WEBAPP_URL || window.location.origin);
    url.pathname = "/s";
    url.searchParams.append("startapp", encodedParams);
    copyTextToClipboardHelper(url.toString());
}
