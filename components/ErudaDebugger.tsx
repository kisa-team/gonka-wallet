"use client";

import { useEffect } from "react";

export function ErudaDebugger() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            import("eruda").then((eruda) => {
                eruda.default.init();
            });
        }
    }, []);

    return null;
}
