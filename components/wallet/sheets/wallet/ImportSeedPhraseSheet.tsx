import { Alert, Button, Textarea } from "@heroui/react";
import { type FC, useState } from "react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useWalletStore, WalletScreen } from "@/hooks/wallet/useWalletStore";

export const ImportSeedPhraseSheet: FC = () => {
    const isOpen = useWalletStore((s) => s.sheets.importSeed);
    const [inputSeedPhrase, setInputSeedPhrase] = useState<string>("");
    const [error, setError] = useState<string>("");

    const handleInputChange = (value: string) => {
        setInputSeedPhrase(value);
        setError("");
    };

    const prepareSeedPhrase = (value: string) => {
        return value
            .replaceAll("\n", " ")
            .replaceAll(",", " ")
            .split(" ")
            .filter((word) => word.trim() !== "")
            .join(" ");
    };

    const importSeedPhrase = async () => {
        const seedPhrase = prepareSeedPhrase(inputSeedPhrase);
        try {
            await useWalletStore.getState().saveSeedPhrase(seedPhrase);
        } catch (error) {
            setError("Invalid seed phrase");
            return;
        }

        setInputSeedPhrase("");
        useWalletStore.getState().closeSheet("importSeed");
        useWalletStore.getState().showScreen(WalletScreen.MAIN);
    };

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => useWalletStore.getState().toggleSheet("importSeed", open)}
            side="bottom"
            parentSelector="#screens"
        >
            <SheetHeader>Import Seed Phrase</SheetHeader>
            <SheetBody className="flex flex-col gap-8 px-4">
                <div className="text-center text-zinc-400">
                    The seed phrase is a 24 words list that is used to restore your wallet
                </div>
                <Textarea
                    variant="bordered"
                    placeholder="Enter your seed phrase (space/newline/comma separated)"
                    minRows={4}
                    value={inputSeedPhrase}
                    onValueChange={handleInputChange}
                />
                {error && (
                    <div>
                        <Alert color="danger">{error}</Alert>
                    </div>
                )}
                <div>
                    <Alert color="primary">
                        We do not upload your seed phrase to our servers. It is stored locally only
                        on your device.
                    </Alert>
                </div>
            </SheetBody>
            <SheetFooter className="flex justify-end">
                <Button color="primary" onPress={() => importSeedPhrase()}>
                    Import
                </Button>
            </SheetFooter>
        </Sheet>
    );
};
