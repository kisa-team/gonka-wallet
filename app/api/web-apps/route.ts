import "server-only";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import type { WebAppResponse } from "@/app/api/web-apps/[slug]/route";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";
import prisma from "@/src/lib/prisma";

export interface WebAppsResponse {
    apps: WebAppResponse[];
}
export const revalidate = 60;

export const GET = fnDecorator([apiRequestWrapper], async () => {
    const apps = await prisma.webApp.findMany({
        select: {
            id: true,
            name: true,
            url: true,
            iconUrl: true,
            iconBase64: true,
            iconBgColor: true,
        },
        where: {
            visible: true,
        },
        orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    return apiResponse<WebAppsResponse>({ apps });
}) as ApiFunc;
