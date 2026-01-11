import { useEffect } from "react";

export const useVisualViewport = () => {
    useEffect(() => {
        const updateViewportHeight = () => {
            if (window.visualViewport) {
                const vh = window.visualViewport.height;
                const offsetTop = window.visualViewport.offsetTop;

                document.documentElement.style.setProperty("--viewport-height", `${vh}px`);
                document.documentElement.style.setProperty(
                    "--viewport-offset-top",
                    `${offsetTop}px`
                );
            } else {
                const vh = window.innerHeight;
                document.documentElement.style.setProperty("--viewport-height", `${vh}px`);
                document.documentElement.style.setProperty("--viewport-offset-top", "0px");
            }
        };

        const preventWindowScroll = () => {
            if (window.scrollY !== 0 || window.scrollX !== 0) {
                window.scrollTo(0, 0);
            }
        };

        updateViewportHeight();
        preventWindowScroll();

        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", updateViewportHeight);
            window.visualViewport.addEventListener("scroll", updateViewportHeight);
        }

        window.addEventListener("resize", updateViewportHeight);
        window.addEventListener("scroll", preventWindowScroll, { passive: false });

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener("resize", updateViewportHeight);
                window.visualViewport.removeEventListener("scroll", updateViewportHeight);
            }
            window.removeEventListener("resize", updateViewportHeight);
            window.removeEventListener("scroll", preventWindowScroll);
        };
    }, []);
};
