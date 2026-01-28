"use client";
import { Tab, Tabs } from "@heroui/react";
import { type FC, useEffect, useState } from "react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { GrantMLOpsPermissionsContent } from "@/components/wallet/sheets/wallet/grant-permissions/GrantMLOpsPermissionsContent";
import { GrantSendTokenPermissionsContent } from "@/components/wallet/sheets/wallet/grant-permissions/GrantSendTokenPermissionsContent";
import { useStartParams } from "@/hooks/useStartParams";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const GrantPermissionsSheet: FC = () => {
    const isOpen = useWalletStore((state) => state.sheets.grantPermissions);
    const [selected, setSelected] = useState("mlOps");
    const startAppParams = useStartParams();

    useEffect(() => {
        if (startAppParams.mlOpAddress) {
            useWalletStore.getState().openSheet("grantPermissions");
        }
    }, [startAppParams.mlOpAddress]);

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("grantPermissions", open)}
            side="bottom"
            parentSelector="#screens"
        >
            <SheetHeader>Grant permissions</SheetHeader>
            <SheetBody className="flex flex-col gap-4 px-4">
                <Tabs
                    aria-label="Grant permissions"
                    classNames={{
                        tabList: "w-full",
                    }}
                    selectedKey={selected}
                    onSelectionChange={(key) => setSelected(key as string)}
                >
                    <Tab key="mlOps" title="ML Ops">
                        <GrantMLOpsPermissionsContent />
                    </Tab>
                    <Tab key="sendToken" title="Send Token">
                        <GrantSendTokenPermissionsContent />
                    </Tab>
                </Tabs>
            </SheetBody>
            <SheetFooter className="flex items-center gap-2"></SheetFooter>
        </Sheet>
    );
};
