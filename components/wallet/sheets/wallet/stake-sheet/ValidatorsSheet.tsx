"use client";
import type { FC } from "react";
import { useState } from "react";
import type { ValidatorWithStats } from "@/app/api/validators/types";
import { Sheet } from "@/components/ui/Sheet";
import { ValidatorSheet } from "@/components/wallet/sheets/wallet/stake-sheet/ValidatorSheet";
import { ValidatorsContent } from "@/components/wallet/sheets/wallet/stake-sheet/ValidatorsContent";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const ValidatorsSheet: FC = () => {
    const isOpen = useWalletStore((s) => s.sheets.validators);
    const userWallet = useWalletStore((state) => state.userWallet);

    const [selectedValidator, setSelectedValidator] = useState<ValidatorWithStats | null>(null);

    const onClickValidator = (validator: ValidatorWithStats) => {
        setSelectedValidator(validator);
        useWalletStore.getState().openSheet("validator");
    };

    if (!userWallet) {
        return null;
    }

    return (
        <>
            <Sheet
                open={isOpen}
                onOpenChange={(open) => useWalletStore.getState().toggleSheet("validators", open)}
                side="bottom"
                parentSelector="#screens"
            >
                <ValidatorsContent onClickValidator={onClickValidator} />
            </Sheet>
            <ValidatorSheet validator={selectedValidator} />
        </>
    );
};
