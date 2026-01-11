import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";
import type { WebApp } from "@/src/app/generated/prisma";
import prisma from "@/src/lib/prisma";
import type { FilterProps } from "@/src/types/primitives";
import ValueUtils from "@/src/utils/ValueUtils";

export type WebAppResponse = FilterProps<
    WebApp,
    "id" | "name" | "url" | "iconUrl" | "iconBase64" | "iconBgColor"
>;
export const revalidate = 60;

export const GET = fnDecorator(
    [apiRequestWrapper],
    async (_: NextRequest, context: { params: Promise<{ slug: string }> }) => {
        const { slug } = await context.params;

        const app = await prisma.webApp.findUnique({
            select: {
                id: true,
                name: true,
                url: true,
                iconUrl: true,
                iconBase64: true,
                iconBgColor: true,
            },
            where: {
                id: ValueUtils.isNumber(Number(slug)) ? Number(slug) : undefined,
                key: ValueUtils.isNumber(Number(slug)) ? undefined : slug,
            },
        });
        if (app) {
            return apiResponse<WebAppResponse>(app);
        }
        return apiResponse(undefined, "App not found", { status: 404 });
    }
) as ApiFunc;
