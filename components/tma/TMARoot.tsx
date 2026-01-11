"use client";
import { init, locationManager, setDebug, swipeBehavior, viewport } from "@tma.js/sdk-react";
import type { FC, ReactNode } from "react";
import { useClientOnce } from "@/hooks/useClientOnce";

interface TMARootProps {
    children?: ReactNode | ReactNode[];
}

const TMARoot: FC<TMARootProps> = ({ children }) => {
    const isDev = process.env.NODE_ENV !== "production";

    useClientOnce(async () => {
        init();

        if (isDev) {
            setDebug(true);
        }

        if (viewport.mount.isAvailable() && !viewport.isMounted()) {
            try {
                await viewport.mount();
            } catch (err) {}
        }

        if (viewport.expand.isAvailable() && !viewport.isExpanded()) {
            viewport.expand();
        }

        if (viewport.bindCssVars.isAvailable() && !viewport.isCssVarsBound()) {
            viewport.bindCssVars();
        }

        if (swipeBehavior.mount.isAvailable() && !swipeBehavior.isMounted()) {
            swipeBehavior.mount();
        }

        if (swipeBehavior.disableVertical.isAvailable() && swipeBehavior.isVerticalEnabled()) {
            swipeBehavior.disableVertical();
        }

        if (locationManager.mount.isAvailable() && !locationManager.isMounted()) {
            try {
                await locationManager.mount();
            } catch (err) {}
        }
    });

    return <div className="tg-viewport">{children}</div>;
};

export default TMARoot;
