"use client";
import { Image } from "@heroui/react";
import { type FC, useMemo } from "react";
import type { WebAppResponse } from "@/app/api/web-apps/[slug]/route";

const iconClassName = "w-full aspect-square rounded-2xl text-4xl";

const cx = (...parts: Array<string | undefined | null | false>) => parts.filter(Boolean).join(" ");

interface AppIconProps {
    webApp?: WebAppResponse | null;
    className?: string;
}

export const AppIcon: FC<AppIconProps> = ({ webApp, className = "" }) => {
    const iconSrc = useMemo(() => {
        if (webApp?.iconUrl) {
            return webApp.iconUrl;
        }
        if (webApp?.iconBase64?.startsWith("data:image/png;base64,")) {
            return webApp.iconBase64;
        }
        return undefined;
    }, [webApp]);

    return (
        <div
            className={cx(iconClassName, `bg-zinc-800 flex items-center justify-center`, className)}
            style={{ backgroundColor: webApp?.iconBgColor || "bg-zinc-800" }}
        >
            {iconSrc ? (
                <Image src={iconSrc} alt={webApp?.name} className={cx(iconClassName, className)} />
            ) : (
                <span className="font-bold text-zinc-500">
                    {webApp?.name.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );
};
