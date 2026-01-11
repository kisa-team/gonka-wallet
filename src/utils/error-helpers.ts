import { addToast, type ToastProps } from "@heroui/toast";
import { useCallback } from "react";

const DEFAULT_USER_ERROR_MESSAGE = "Something went wrong";
export function useErrorToast() {
    return useCallback((error: any, userDescription?: string | boolean) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userErrorMessage = DEFAULT_USER_ERROR_MESSAGE;
        if (typeof userDescription === "string") {
            userErrorMessage = userDescription;
        }
        if (typeof userDescription === "boolean" && userDescription && errorMessage) {
            userErrorMessage = errorMessage;
        }
        if (error) {
            console.error(error, userDescription);
        }

        const toast: Partial<ToastProps> = {
            title: DEFAULT_USER_ERROR_MESSAGE,
            color: "danger",
            timeout: 3000,
        };
        if (userErrorMessage === DEFAULT_USER_ERROR_MESSAGE) {
            toast.title = userErrorMessage;
        } else if (typeof userErrorMessage === "string") {
            toast.title = "Error";
            toast.description = userErrorMessage;
        }

        addToast(toast);
    }, []);
}
