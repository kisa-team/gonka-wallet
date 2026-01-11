"use client";

import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <HeroUIProvider className={"w-full h-full"}>
            <ToastProvider placement={"top-center"} toastOffset={60} />
            {/* <ErudaDebugger /> */}
            {children}
        </HeroUIProvider>
    );
}
