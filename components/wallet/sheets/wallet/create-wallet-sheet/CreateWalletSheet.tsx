import { type FC, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { CheckSeedContent } from "@/components/wallet/sheets/wallet/create-wallet-sheet/CheckSeedContent";
import { GenerateSeedContent } from "@/components/wallet/sheets/wallet/create-wallet-sheet/GenerateSeedContent";
import { useWalletStore, WalletScreen } from "@/hooks/wallet/useWalletStore";

type CreateStep = "generate" | "check";

export const CreateWalletSheet: FC = () => {
    const isOpen = useWalletStore((s) => s.sheets.create);
    const [step, setStep] = useState<CreateStep>("generate");

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("create", open)}
            side="bottom"
            parentSelector="#screens"
        >
            {step === "generate" && <GenerateSeedContent onNext={() => setStep("check")} />}
            {step === "check" && (
                <CheckSeedContent
                    onBack={() => setStep("generate")}
                    onValid={() => {
                        useWalletStore.getState().closeSheet("create");
                        useWalletStore.getState().showScreen(WalletScreen.MAIN);
                    }}
                />
            )}
        </Sheet>
    );
};
