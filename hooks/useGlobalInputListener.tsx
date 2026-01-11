import { useEffect, useRef } from "react";
import { useDevice } from "./useDevice";

export interface InputCallbacks {
    onFocus?: (element: HTMLInputElement, event: FocusEvent) => void;
    onBlur?: (element: HTMLInputElement, event: FocusEvent) => void;
    onKeyboardShow?: (keyboardHeight: number) => void;
    onKeyboardHide?: () => void;
}

export const useGlobalInputListener = (callbacks: InputCallbacks = {}) => {
    const isInitialized = useRef(false);
    const timer = useRef<NodeJS.Timeout | null>(null);
    const { isMobile } = useDevice();
    const delay = 300;

    useEffect(() => {
        if (!isMobile) return;
        if (isInitialized.current) return;
        isInitialized.current = true;

        const {
            onFocus = () => {},
            onBlur = () => {},
            onKeyboardShow = () => {},
            onKeyboardHide = () => {},
        } = callbacks;

        const initialViewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
        let isKeyboardOpen = false;

        const refreshLayout = () => {
            if (typeof window === "undefined") return;

            const currentScroll = window.scrollY;
            window.scrollTo(0, currentScroll + 1);

            requestAnimationFrame(() => {
                window.scrollTo(0, currentScroll);

                document.body.style.transform = "translateZ(0)";
                document.body.offsetHeight;
                document.body.style.transform = "";

                window.dispatchEvent(new Event("resize"));
            });
        };

        const handleFocusIn = (event: any) => {
            const target = event.target;

            if (
                target?.matches('input, textarea, [contenteditable="true"], gmp-place-autocomplete')
            ) {
                onFocus(target, event);

                setTimeout(() => {
                    refreshLayout();
                }, delay);

                if (timer.current) {
                    clearTimeout(timer.current);
                }
                timer.current = setTimeout(() => {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                }, delay);
            }
        };

        const handleFocusOut = (event: any) => {
            const target = event.target;

            if (target?.matches('input, textarea, [contenteditable="true"]')) {
                onBlur(target, event);

                setTimeout(() => {
                    refreshLayout();
                }, delay);

                if (timer.current) {
                    clearTimeout(timer.current);
                }
            }
        };

        const handleViewportChange = () => {
            if (typeof window === "undefined") return;

            const currentHeight = window.visualViewport?.height || window.innerHeight;
            const keyboardHeight = initialViewportHeight - currentHeight;

            if (keyboardHeight > 100 && !isKeyboardOpen) {
                isKeyboardOpen = true;
                onKeyboardShow(keyboardHeight);
                setTimeout(() => {
                    refreshLayout();
                    const activeElement = document.activeElement as HTMLElement;
                    if (activeElement?.matches('input, textarea, [contenteditable="true"]')) {
                        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, delay);
            } else if (keyboardHeight <= 100 && isKeyboardOpen) {
                isKeyboardOpen = false;
                onKeyboardHide();
                setTimeout(() => refreshLayout(), delay);
            }
        };

        document.addEventListener("focusin", handleFocusIn, true);
        document.addEventListener("focusout", handleFocusOut, true);

        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", handleViewportChange);
        } else {
            window.addEventListener("resize", handleViewportChange);
        }

        return () => {
            document.removeEventListener("focusin", handleFocusIn, true);
            document.removeEventListener("focusout", handleFocusOut, true);

            if (window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleViewportChange);
            } else {
                window.removeEventListener("resize", handleViewportChange);
            }

            isInitialized.current = false;
        };
    }, [callbacks, isMobile]);
};
