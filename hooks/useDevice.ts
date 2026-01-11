"use client";

export type DeviceName = "android" | "ios" | "ipad" | "macos" | "web";

export const useDevice = () => {
    let isMobile = false;
    let device: DeviceName = "web";
    if (typeof window === "undefined" || !window.navigator) {
        return { isMobile: false, device: "web" };
    }

    const isM: boolean = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
    const isIPad: boolean = !!(
        navigator.userAgent.match(/Mac/) &&
        navigator.maxTouchPoints &&
        navigator.maxTouchPoints > 0 &&
        "ontouchend" in document
    );
    isMobile = isM || isIPad;

    if (/android/i.test(navigator.userAgent)) {
        device = "android";
    } else if (isIPad) {
        device = "ipad";
    } else if (/iPhone/i.test(navigator.userAgent)) {
        device = "ios";
    } else {
        device = "web";
    }

    return { isMobile, device };
};
