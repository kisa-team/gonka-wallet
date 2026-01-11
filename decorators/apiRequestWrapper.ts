import "server-only";
import * as Sentry from "@sentry/nextjs";
import { apiResponse } from "@/app/api/api-helpers";

export const apiRequestWrapper = (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
): void => {
    const oldValue = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        try {
            return await oldValue.apply(this, args);
        } catch (e: any) {
            if (e instanceof Error && e.message === "Invalid or expired session") {
                return apiResponse(undefined, e.message, { status: 400 });
            }

            Sentry.captureException(e, {
                tags: {
                    component: "apiRequestWrapper",
                },
                extra: {
                    method: _propertyKey,
                },
            });

            console.error("API ERROR: ", e.message);
            return apiResponse(undefined, e.message);
        }
    };
};
