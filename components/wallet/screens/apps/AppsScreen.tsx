"use client";
import { Card, Spinner } from "@heroui/react";
import { type FC, useMemo } from "react";
import { IoEllipsisHorizontal } from "react-icons/io5";
import type { WebAppsResponse } from "@/app/api/web-apps/route";
import { Logo } from "@/components/ui/Logo";
import { useWebApps } from "@/hooks/wallet/apps/useWebApps";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

const iconClassName = "w-full aspect-square rounded-2xl";

export const AppsScreen: FC = () => {
    const webAppsResponse = useWebApps();
    const webApps = webAppsResponse.data?.apps || [];

    const dummyApps = useMemo(() => {
        const maxApps = 4 * 4;
        const dummyCount = maxApps - webApps.length;
        return Array.from({ length: dummyCount });
    }, [webApps]);

    const renderApp = (app: WebAppsResponse["apps"][number]) => {
        return (
            <Card
                key={app.id}
                className="flex flex-col items-center justify-center gap-2 bg-transparent rounded-2xl"
                isPressable
                shadow="none"
                onPress={() => useWalletStore.getState().setSelectedAppId(app.id)}
            >
                <div className="w-full aspect-square">
                    <Logo
                        name={app.name}
                        iconUrl={app.iconUrl}
                        iconBase64={app.iconBase64}
                        iconBgColor={app.iconBgColor}
                    />
                </div>
                <div className="text-xs text-zinc-400">{app.name}</div>
            </Card>
        );
    };

    return (
        <div className="flex flex-col gap-6 p-4 pb-6 h-full overflow-y-auto">
            {webAppsResponse.isLoading && (
                <Spinner size="lg" color="primary" variant="wave" className="m-auto" />
            )}
            {!webAppsResponse.isLoading && webApps.length === 0 && (
                <div className="text-center text-zinc-400 m-auto">No apps found</div>
            )}
            {!webAppsResponse.isLoading && webApps.length > 0 && (
                <div className="grid grid-cols-4 gap-6 items-start">
                    {webApps.map((app) => renderApp(app))}
                    {dummyApps.map((_, i) => (
                        <div
                            key={i.toString()}
                            className={`border-2 border-dashed border-zinc-700 ${iconClassName} flex items-center justify-center text-zinc-600`}
                        >
                            <IoEllipsisHorizontal className="w-6 h-6" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
