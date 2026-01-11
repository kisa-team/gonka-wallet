import base64url from "base64url";
import type { WalletScreen } from "@/hooks/wallet/useWalletStore";
import ValueUtils from "@/src/utils/ValueUtils";

export interface StartAppParams {
    screenName: WalletScreen;
    walletConnectUri: string;
    webAppId: number;
    webAppParams: string;
    mlOpAddress: string;
}

const START_APP_PARAM_TYPES: { [key in keyof StartAppParams]: "number" | "string" } = {
    screenName: "string",
    walletConnectUri: "string",
    webAppId: "number",
    webAppParams: "string",
    mlOpAddress: "string",
};

const START_APP_SHORT_PARAMS: { [key in keyof StartAppParams]: string } = {
    screenName: "sn",
    walletConnectUri: "wcu",
    webAppId: "wai",
    webAppParams: "wap",
    mlOpAddress: "mloa",
};

export function encodeStartAppParams(params: Partial<StartAppParams>): string {
    const parts: string[] = [];

    for (const key in params) {
        if (Object.hasOwn(params, key)) {
            const shortKey = START_APP_SHORT_PARAMS[key as keyof StartAppParams];
            const value = params[key as keyof StartAppParams];
            if (value !== undefined && value !== null && value !== "") {
                const paramType = START_APP_PARAM_TYPES[key as keyof StartAppParams];
                if (paramType === "string") {
                    const encodedValue = base64url.encode(String(value));
                    parts.push(`${shortKey}=${encodedValue}`);
                } else {
                    parts.push(`${shortKey}=${value}`);
                }
            }
        }
    }

    return base64url.encode(parts.join("|"));
}

export function decodeStartAppParams(encoded: string): Partial<StartAppParams> {
    const result: Partial<StartAppParams> = {};
    if (!encoded) {
        return result;
    }

    decode(base64url.decode(encoded), result);
    return result;
}

function decode(decoded: string, result: Partial<StartAppParams>): void {
    const pairs = decoded.split("|");
    for (const pair of pairs) {
        parsePair(pair, result);
    }
}

function parsePair(pair: string, result: Partial<StartAppParams>): void {
    if (!pair) return;

    const equalIndex = pair.indexOf("=");
    if (equalIndex === -1) {
        return;
    }

    const shortKey = pair.substring(0, equalIndex);
    const value = pair.substring(equalIndex + 1);

    const longKey = Object.keys(START_APP_SHORT_PARAMS).find(
        (key) => START_APP_SHORT_PARAMS[key as keyof StartAppParams] === shortKey
    ) as keyof StartAppParams | undefined;

    if (!longKey) return;

    const paramType = START_APP_PARAM_TYPES[longKey];
    let typedValue: number | string | undefined;

    if (paramType === "string") {
        try {
            typedValue = base64url.decode(value);
        } catch {
            return;
        }
    } else if (paramType === "number") {
        typedValue = ValueUtils.isNumber(Number(value)) ? Number(value) : undefined;
    } else {
        typedValue = value;
    }

    if (typedValue !== undefined && typedValue !== null && typedValue !== "") {
        // @ts-expect-error ...
        result[longKey] = typedValue;
    }
}
