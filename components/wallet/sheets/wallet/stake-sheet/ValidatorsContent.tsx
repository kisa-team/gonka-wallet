"use client";
import { Chip, Spinner } from "@heroui/react";
import type { FC } from "react";
import type { ValidatorWithStats } from "@/app/api/validators/types";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { ValidatorCard } from "@/components/wallet/sheets/wallet/stake-sheet/ValidatorCard";
import { useValidators } from "@/hooks/wallet/useValidators";

interface ValidatorsContentProps {
    onClickValidator: (validator: ValidatorWithStats) => void;
}

export const ValidatorsContent: FC<ValidatorsContentProps> = ({ onClickValidator }) => {
    const { validators, isLoading: isLoadingValidators } = useValidators();

    return (
        <>
            <SheetHeader>Select Validator</SheetHeader>
            <SheetBody className="px-4 py-4 space-y-4 overflow-y-auto">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                        <div className="text-zinc-400 items-center flex gap-2">
                            Validators{" "}
                            <Chip color="primary" size="sm" variant="flat">
                                {validators.length}
                            </Chip>
                        </div>
                        {isLoadingValidators ? (
                            <div className="flex justify-center py-8">
                                <Spinner size="lg" color="primary" variant="wave" />
                            </div>
                        ) : validators.length === 0 ? (
                            <div className="text-center text-zinc-400 py-8">
                                Validators not found
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 overflow-y-auto">
                                {validators.map((validator) => (
                                    <ValidatorCard
                                        key={validator.operator_address}
                                        validator={validator}
                                        onClickValidator={onClickValidator}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SheetBody>
            <SheetFooter></SheetFooter>
        </>
    );
};
