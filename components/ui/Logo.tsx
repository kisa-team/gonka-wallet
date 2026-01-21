"use client";
import { Image } from "@heroui/react";
import { type FC, useMemo } from "react";

const iconClassName = "w-full aspect-square rounded-2xl text-4xl";

const cx = (...parts: Array<string | undefined | null | false>) => parts.filter(Boolean).join(" ");

interface LogoProps {
    name?: string;
    iconUrl?: string | null;
    iconBase64?: string | null;
    iconBgColor?: string | null;
    className?: string;
}

export const Logo: FC<LogoProps> = ({ name, iconUrl, iconBase64, iconBgColor, className = "" }) => {
    const iconSrc = useMemo(() => {
        if (iconUrl) {
            return iconUrl;
        }
        if (iconBase64?.startsWith("data:image")) {
            return iconBase64;
        }
        return undefined;
    }, [iconUrl, iconBase64]);

    return (
        <div
            className={cx(iconClassName, `bg-zinc-800 flex items-center justify-center`, className)}
            style={{ backgroundColor: iconBgColor || "bg-zinc-800" }}
        >
            {iconSrc ? (
                <Image src={iconSrc} alt={name} className={cx(iconClassName, className)} />
            ) : (
                <span className="font-bold text-zinc-500">{name?.charAt(0).toUpperCase()}</span>
            )}
        </div>
    );
};
