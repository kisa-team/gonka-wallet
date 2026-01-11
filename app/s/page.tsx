import { headers } from "next/headers";
import { BsBrowserSafari } from "react-icons/bs";
import { FaTelegram } from "react-icons/fa6";

interface WalletConnectPageProps {
    searchParams: Promise<{
        wc?: string;
        [key: string]: string | string[] | undefined;
    }>;
}

export default async function SharePage({ searchParams }: WalletConnectPageProps) {
    const params = await searchParams;
    const startapp = typeof params.startapp === "string" ? params.startapp : undefined;

    const headersList = await headers();
    const host = headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const currentUrl = `${protocol}://${host}`;

    const webAppUrl = process.env.NEXT_PUBLIC_WEBAPP_URL || currentUrl;
    let webAppRedirectUrl = `${webAppUrl}/wallet`;

    let tmaRedirectUrl = "";
    const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    const telegramTmaName = process.env.NEXT_PUBLIC_TELEGRAM_TMA_NAME;
    if (telegramBotUsername && telegramTmaName) {
        tmaRedirectUrl = `https://t.me/${telegramBotUsername}/${telegramTmaName}`;
    }

    webAppRedirectUrl = `${webAppRedirectUrl}${startapp ? `?startapp=${startapp}` : ""}`;

    if (tmaRedirectUrl) {
        tmaRedirectUrl = `${tmaRedirectUrl}${startapp ? `?startapp=${startapp}` : ""}`;
    }

    return (
        <main className="flex flex-col gap-4 text-center justify-center items-center h-screen">
            <h1 className="text-4xl font-semibold">
                <span>Continue</span>
                <br />
                in <span className="text-primary">Gonka Wallet</span>
            </h1>
            <p className="text-zinc-500">
                Select what version of Gonka Wallet you want to open to continue.
            </p>

            <div className="mt-6 flex flex-col gap-3">
                {tmaRedirectUrl && (
                    <a
                        href={tmaRedirectUrl}
                        className="flex items-center gap-2 bg-default p-4 rounded-xl"
                    >
                        <FaTelegram className="w-8 h-8" /> Open in Telegram
                    </a>
                )}

                <a
                    href={webAppRedirectUrl}
                    className="flex items-center gap-2 bg-default p-4 rounded-xl"
                >
                    <BsBrowserSafari className="w-8 h-8" /> Open in Web App
                </a>
            </div>
        </main>
    );
}
