"use client";

import { Button } from "@heroui/react";
import { animate, motion, useMotionValue } from "framer-motion";
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { useDevice } from "@/hooks/useDevice";

const SHEET_CONFIG = {
    snapFallback: [1] as number[],
    maxSideWidthPx: 800,
    hiddenExtraPx: 80,
    dragElastic: 0.28,
    closeVelocity: 1,
    closeProgress: 0.65,
    overlayFade: { duration: 0.25, hideDelayMs: 260 },
    autoCloseDuration: 0.25,
    spring: { stiffness: 150, damping: 23, bounce: 0 },
    tween: { duration: 0.22, ease: "easeOut" as const },
} as const;

type SheetSide = "auto" | "bottom" | "right";
type ContentFit = "full" | "content";

export interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    side?: SheetSide;
    contentFit?: ContentFit;
    snapPoints?: number[];
    initialSnap?: number;
    dismissible?: boolean;
    showCloseButtonDesktop?: boolean;
    overlayBlur?: boolean;
    parentSelector?: string;
}

interface SectionProps {
    children?: ReactNode;
    className?: string;
}

const SheetContext = createContext<ContentFit>("full");

const cx = (...parts: Array<string | undefined | null | false>) => parts.filter(Boolean).join(" ");

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const useViewportSize = () => {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const update = () => {
            const vv = window.visualViewport;
            setSize({
                width: vv?.width ?? window.innerWidth,
                height: vv?.height ?? window.innerHeight,
            });
        };

        update();
        window.addEventListener("resize", update);
        window.visualViewport?.addEventListener("resize", update);
        window.visualViewport?.addEventListener("scroll", update);

        return () => {
            window.removeEventListener("resize", update);
            window.visualViewport?.removeEventListener("resize", update);
            window.visualViewport?.removeEventListener("scroll", update);
        };
    }, []);

    return size;
};

const useSnapPoints = (snapPoints: number[] | undefined, dimension: number) => {
    const normalized = useMemo(() => {
        const base = snapPoints?.length ? snapPoints : SHEET_CONFIG.snapFallback;
        const unique = [...new Set(base.map((p) => clamp(Number.isFinite(p) ? p : 0, 0.1, 1)))];
        const sorted = unique.sort((a, b) => a - b);
        return sorted.length ? sorted : [1];
    }, [snapPoints]);

    const pixels = useMemo(
        () => normalized.map((p) => Math.max(1, Math.round(p * dimension))),
        [normalized, dimension]
    );

    const offsets = useMemo(
        () => pixels.map((v) => Math.max(0, dimension - v)),
        [pixels, dimension]
    );

    return { normalized, pixels, offsets };
};

const useSheetAnimation = (
    translate: ReturnType<typeof useMotionValue<number>>,
    open: boolean,
    targetOffset: number,
    hiddenOffset: number,
    onClosed: () => void
) => {
    useEffect(() => {
        const target = open ? targetOffset : hiddenOffset;
        const controls = animate(translate, target, {
            type: open ? "spring" : "tween",
            bounce: open ? SHEET_CONFIG.spring.bounce : 0,
            duration: open ? undefined : SHEET_CONFIG.autoCloseDuration,
            stiffness: SHEET_CONFIG.spring.stiffness,
            damping: SHEET_CONFIG.spring.damping,
            onComplete: () => {
                if (!open) onClosed();
            },
        });

        return () => controls.stop();
    }, [translate, open, targetOffset, hiddenOffset, onClosed]);
};

const useSheetDrag = ({
    dismissible,
    isVertical,
    translate,
    offsets,
    hiddenOffset,
    snapIndex,
    setSnapIndex,
    onOpenChange,
}: {
    dismissible: boolean;
    isVertical: boolean;
    translate: ReturnType<typeof useMotionValue<number>>;
    offsets: number[];
    hiddenOffset: number;
    snapIndex: number;
    setSnapIndex: (i: number) => void;
    onOpenChange: (open: boolean) => void;
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const animateToOffset = useCallback(
        (target: number, useSpring = true) => {
            animate(translate, target, {
                type: useSpring ? "spring" : "tween",
                bounce: useSpring ? SHEET_CONFIG.spring.bounce : 0,
                duration: useSpring ? undefined : SHEET_CONFIG.tween.duration,
                stiffness: SHEET_CONFIG.spring.stiffness,
                damping: SHEET_CONFIG.spring.damping,
                ease: useSpring ? undefined : SHEET_CONFIG.tween.ease,
            });
        },
        [translate]
    );

    const findNearest = useCallback((value: number, candidates: number[]) => {
        return candidates.reduce((nearest, c) =>
            Math.abs(c - value) < Math.abs(nearest - value) ? c : nearest
        );
    }, []);

    const handleDragStart = useCallback(() => {
        if (dismissible) setIsDragging(true);
    }, [dismissible]);

    const handleDragEnd = useCallback(
        (_: unknown, info: { velocity: { x: number; y: number } }) => {
            const velocity = isVertical ? info.velocity.y : info.velocity.x;
            const current = translate.get();
            const projected = current + velocity * 0.2;
            const progress = current / hiddenOffset;

            const candidates = [...offsets, hiddenOffset];
            const nearest = findNearest(projected, candidates);

            const isClosingDir = velocity > 0;
            const closeByVelocity =
                isClosingDir && velocity > SHEET_CONFIG.closeVelocity && progress > 0.25;
            const closeByProgress = progress > SHEET_CONFIG.closeProgress;
            const closeByNearest = isClosingDir && nearest === hiddenOffset;

            if (dismissible && (closeByNearest || closeByProgress || closeByVelocity)) {
                animateToOffset(hiddenOffset, false);
                onOpenChange(false);
                return;
            }

            let target = nearest;
            if (!dismissible && target === hiddenOffset) {
                target = offsets[snapIndex] ?? 0;
            }

            const nextIndex = offsets.indexOf(target);
            if (nextIndex >= 0) setSnapIndex(nextIndex);

            animateToOffset(target);
        },
        [
            animateToOffset,
            dismissible,
            findNearest,
            hiddenOffset,
            isVertical,
            offsets,
            onOpenChange,
            snapIndex,
            setSnapIndex,
            translate,
        ]
    );

    useEffect(() => {
        if (!dismissible || !isDragging) return;

        const handlePointerUp = () => {
            setIsDragging(false);
            const current = translate.get();
            const progress = current / hiddenOffset;

            if (progress > SHEET_CONFIG.closeProgress) {
                animateToOffset(hiddenOffset, false);
                onOpenChange(false);
                return;
            }

            const nearest = findNearest(current, offsets);
            const nearestIndex = offsets.indexOf(nearest);
            if (nearestIndex >= 0) setSnapIndex(nearestIndex);
            animateToOffset(nearest);
        };

        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerUp);

        return () => {
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
        };
    }, [
        animateToOffset,
        dismissible,
        findNearest,
        hiddenOffset,
        isDragging,
        offsets,
        onOpenChange,
        setSnapIndex,
        translate,
    ]);

    return { handleDragStart, handleDragEnd };
};

const useEscapeKey = (
    open: boolean,
    dismissible: boolean,
    onOpenChange: (open: boolean) => void
) => {
    useEffect(() => {
        if (!open || !dismissible) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, dismissible, onOpenChange]);
};

export const Sheet = ({
    open,
    onOpenChange,
    children,
    side = "bottom",
    contentFit = "full",
    snapPoints,
    initialSnap,
    dismissible = true,
    showCloseButtonDesktop = true,
    overlayBlur = false,
    parentSelector,
}: SheetProps) => {
    const { isMobile } = useDevice();
    const resolvedSide = side === "auto" ? (isMobile ? "bottom" : "right") : side;
    const isVertical = resolvedSide === "bottom";

    const viewport = useViewportSize();
    const [mounted, setMounted] = useState(false);
    const [render, setRender] = useState(open);
    const [portalEl, setPortalEl] = useState<Element | null>(null);
    const sheetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const parent = parentSelector ? document.querySelector(parentSelector) : document.body;
        setPortalEl(parent ?? document.body);
    }, [parentSelector]);

    useEffect(() => {
        if (open) {
            setRender(true);
            return;
        }
        const timeout = setTimeout(() => setRender(false), SHEET_CONFIG.overlayFade.hideDelayMs);
        return () => clearTimeout(timeout);
    }, [open]);

    const dimension = useMemo(() => {
        if (!mounted) return 0;
        const rawSize = isVertical ? viewport.height : viewport.width;
        const limited = isVertical ? rawSize : Math.min(rawSize, SHEET_CONFIG.maxSideWidthPx);
        return Math.max(1, Math.round(limited));
    }, [isVertical, mounted, viewport.height, viewport.width]);

    const hiddenOffset = dimension + SHEET_CONFIG.hiddenExtraPx;
    const { normalized, offsets } = useSnapPoints(snapPoints, dimension);

    const initialSnapValue = initialSnap ?? normalized[normalized.length - 1];
    const initialSnapIndex = useMemo(() => {
        let closest = 0;
        normalized.forEach((p, i) => {
            if (Math.abs(p - initialSnapValue) < Math.abs(normalized[closest] - initialSnapValue)) {
                closest = i;
            }
        });
        return closest;
    }, [initialSnapValue, normalized]);

    const [snapIndex, setSnapIndex] = useState(initialSnapIndex);

    useEffect(() => {
        setSnapIndex((curr) => {
            const safe = clamp(curr, 0, Math.max(offsets.length - 1, 0));
            const desired = clamp(initialSnapIndex, 0, Math.max(offsets.length - 1, 0));
            return Number.isFinite(desired) ? desired : safe;
        });
    }, [initialSnapIndex, offsets.length]);

    const translate = useMotionValue(hiddenOffset);
    const targetOffset = offsets[snapIndex] ?? 0;

    const handleClosed = useCallback(() => setRender(false), []);

    useSheetAnimation(translate, open, targetOffset, hiddenOffset, handleClosed);

    const { handleDragStart, handleDragEnd } = useSheetDrag({
        dismissible,
        isVertical,
        translate,
        offsets,
        hiddenOffset,
        snapIndex,
        setSnapIndex,
        onOpenChange,
    });

    useEscapeKey(open, dismissible, onOpenChange);

    const dragConstraints = useMemo(() => {
        if (!dismissible) return undefined;
        return isVertical ? { top: 0, bottom: hiddenOffset } : { left: 0, right: hiddenOffset };
    }, [dismissible, hiddenOffset, isVertical]);

    if (!render || typeof document === "undefined" || !portalEl) {
        return null;
    }

    const isContentFit = contentFit === "content";

    const sizeStyle = isVertical
        ? {
              width: "100%",
              maxWidth: "100%",
              ...(isContentFit ? {} : { height: "100%", maxHeight: "100%" }),
          }
        : {
              height: "100%",
              maxHeight: "100%",
              width: dimension,
              maxWidth: dimension,
          };

    const motionStyle = {
        ...(isVertical ? { y: translate } : { x: translate }),
        ...sizeStyle,
    };

    const alignClasses = isVertical ? "items-end justify-center" : "items-center justify-end";
    const cornerClass = isVertical ? "rounded-t-3xl" : "rounded-l-3xl";

    return createPortal(
        <SheetContext.Provider value={contentFit}>
            <div className="absolute inset-0 z-[50] flex">
                <motion.div
                    className={cx(
                        "absolute inset-0 bg-black/60",
                        overlayBlur && "backdrop-blur-md"
                    )}
                    aria-label="Sheet overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: open ? 1 : 0 }}
                    transition={{ duration: SHEET_CONFIG.overlayFade.duration }}
                    onClick={() => dismissible && onOpenChange(false)}
                />

                <div
                    className={cx("relative flex w-full h-full pointer-events-none", alignClasses)}
                >
                    <motion.div
                        ref={sheetRef}
                        className={cx(
                            "relative pointer-events-auto bg-background text-white shadow-2xl flex flex-col",
                            cornerClass,
                            isContentFit && isVertical && "max-h-[100dvh]"
                        )}
                        drag={dismissible ? (isVertical ? "y" : "x") : false}
                        dragElastic={dismissible ? SHEET_CONFIG.dragElastic : 0}
                        dragMomentum={dismissible}
                        onDragStart={dismissible ? handleDragStart : undefined}
                        onDragEnd={dismissible ? handleDragEnd : undefined}
                        dragConstraints={dragConstraints}
                        style={motionStyle}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-2 shrink-0">
                            {dismissible && isVertical && (
                                <div className="h-1 w-14 bg-white/20 rounded-full" />
                            )}
                        </div>

                        {dismissible && (isVertical || showCloseButtonDesktop) && (
                            <div className="absolute left-3 top-3">
                                <Button
                                    isIconOnly
                                    radius="full"
                                    className="bg-zinc-800"
                                    onPress={() => onOpenChange(false)}
                                >
                                    <IoClose className="h-6 w-6" />
                                </Button>
                            </div>
                        )}

                        <div
                            className={cx(
                                "flex flex-col overflow-hidden max-h-full",
                                !isContentFit && "h-full"
                            )}
                        >
                            {children}
                        </div>
                    </motion.div>
                </div>
            </div>
        </SheetContext.Provider>,
        portalEl
    );
};

export const SheetHeader = ({ children, className }: SectionProps) => (
    <div className={cx("px-4 pb-2 text-lg text-center font-semibold shrink-0 min-h-10", className)}>
        {children}
    </div>
);

export const SheetBody = ({ children, className }: SectionProps) => {
    const contentFit = useContext(SheetContext);

    return (
        <div
            className={cx("overflow-y-auto min-h-0", contentFit === "full" && "flex-1", className)}
        >
            {children}
        </div>
    );
};

export const SheetFooter = ({ children, className }: SectionProps) => (
    <div className={cx("px-4 pb-4 pt-3 shrink-0", className)}>{children}</div>
);
