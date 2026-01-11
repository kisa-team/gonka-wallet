import { Alert, Button, ButtonGroup } from "@heroui/react";
import { type FC, useEffect, useMemo } from "react";
import { MdContentCopy } from "react-icons/md";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useCopyTextToClipboard } from "@/hooks/useCopyTextToClipboard";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

interface GenerateSeedContentProps {
    onNext: () => void;
}

export const GenerateSeedContent: FC<GenerateSeedContentProps> = ({ onNext }) => {
    const creatingSeedPhrase = useWalletStore((s) => s.creatingSeedPhrase);
    const numberedSeedPhrase = useMemo(() => {
        return creatingSeedPhrase
            .split(" ")
            .map((word, i) => `${i + 1}. ${word}`)
            .join("\n");
    }, [creatingSeedPhrase]);
    const copyTextToClipboard = useCopyTextToClipboard();

    useEffect(() => {
        if (!creatingSeedPhrase) {
            useWalletStore.getState().generateSeedPhrase();
        }
    }, [creatingSeedPhrase]);

    return (
        <>
            <SheetHeader>Seed Phrase</SheetHeader>
            <SheetBody className="flex flex-col gap-8 px-4">
                <div className="text-center text-zinc-400">
                    Write these words with their numbers and save them in a safe place
                </div>
                <div className="grid grid-cols-2 gap-x-16 gap-y-2 w-fit mx-auto">
                    {creatingSeedPhrase.split(" ").map((word, i) => (
                        <div key={i.toString()} className="flex items-center gap-4">
                            <div className="text-zinc-400 w-4">{i + 1}.</div>
                            <div className="">{word}</div>
                        </div>
                    ))}
                </div>
                <ButtonGroup className="w-fit mx-auto">
                    <Button
                        variant="bordered"
                        className="w-fit mx-auto"
                        startContent={<MdContentCopy />}
                        onPress={() =>
                            copyTextToClipboard(creatingSeedPhrase, "Seed phrase copied")
                        }
                    >
                        Copy
                    </Button>

                    <Button
                        variant="bordered"
                        className="w-fit mx-auto"
                        onPress={() =>
                            copyTextToClipboard(
                                numberedSeedPhrase,
                                "Seed phrase with numbers copied"
                            )
                        }
                    >
                        with numbers
                    </Button>
                </ButtonGroup>
                <div>
                    <Alert color="warning">
                        If you lose your seed phrase, you will permanently lose access to your
                        wallet.
                    </Alert>
                </div>
            </SheetBody>
            <SheetFooter className="flex justify-between">
                <Button
                    variant="bordered"
                    onPress={() => useWalletStore.getState().generateSeedPhrase()}
                >
                    Generate another
                </Button>
                <Button color="primary" onPress={onNext}>
                    Next
                </Button>
            </SheetFooter>
        </>
    );
};
