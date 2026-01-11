import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";

export const ngonkaToGonka = (amount: string, maximumFractionDigits: number = 9) => {
    return `${(Number(amount) / GonkaWallet.NGONKA_TO_GONKA).toLocaleString("en-US", { maximumFractionDigits })} GNK`;
};

export const formatTokens = (
    amount: string,
    denom: string = "ngonka",
    maximumFractionDigits: number = 6
) => {
    const num = Number(amount);
    if (denom === "ngonka") {
        if (num >= GonkaWallet.NGONKA_TO_GONKA) {
            return `${(num / GonkaWallet.NGONKA_TO_GONKA).toLocaleString("en-US", { maximumFractionDigits })} GNK`;
        }
        return `${num.toLocaleString()} ${denom}`;
    }
    return `${num} ${denom}`;
};

export const formatCommission = (rate: string) => {
    const num = Number(rate);
    return `${(num * 100).toFixed(2)}%`;
};

export function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export function formatTxHash(hash: string): string {
    if (!hash) return "";
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export function formatDateAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateString;
    }
};

export function formatFullDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
}
