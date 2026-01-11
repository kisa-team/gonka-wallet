"use client";
import { useMemo } from "react";
import { getLocation } from "@/hooks/wallet/useWalletStore";
import { decodeStartAppParams, type StartAppParams } from "@/src/utils/StartAppParams";

const allowedParamKeys = ["startapp", "tgWebAppStartParam"];

export const useStartParams = () => {
    const params: Partial<StartAppParams> = useMemo(() => {
        const parts = getLocation()?.search.substring(1).split("=") || [];
        const paramsKeyIndex = parts.findIndex((p) => allowedParamKeys.includes(p));
        if (paramsKeyIndex === -1) {
            return {};
        }
        const params: string | undefined = parts[paramsKeyIndex + 1];
        if (!params) {
            return {};
        }
        return decodeStartAppParams(params);
    }, []);
    return params;
};
