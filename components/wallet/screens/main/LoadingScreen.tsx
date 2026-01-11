"use client";
import { Spinner } from "@heroui/react";
import type { FC } from "react";

export const LoadingScreen: FC = () => {
    return (
        <div className="flex h-full">
            <div className="m-auto">
                <Spinner size="lg" color="primary" variant="wave" />
            </div>
        </div>
    );
};
