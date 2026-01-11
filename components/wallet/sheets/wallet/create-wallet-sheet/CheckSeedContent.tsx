import { Alert, Button, Input } from "@heroui/react";
import { type FC, useMemo, useState } from "react";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";
import { Randomize } from "@/src/utils/Randomize";

interface CheckSeedContentProps {
    onBack: () => void;
    onValid: () => void;
}

export const CheckSeedContent: FC<CheckSeedContentProps> = ({ onBack, onValid }) => {
    const creatingSeedPhrase = useWalletStore((state) => state.creatingSeedPhrase);

    const words = useMemo(() => {
        return creatingSeedPhrase.split(" ");
    }, [creatingSeedPhrase]);
    const checkWordIndexes = useMemo(() => {
        const indexes: number[] = [];
        while (indexes.length < 3) {
            const randomIndex = Randomize.getRandomInt(0, words.length - 1);
            if (!indexes.includes(randomIndex)) {
                indexes.push(randomIndex);
            }
        }
        return indexes.sort((a, b) => a - b);
    }, [words.length]);
    const [enteredWords, setEnteredWords] = useState<string[]>(["", "", ""]);
    const [error, setError] = useState<string>("");

    const handleWordChange = (index: number, value: string) => {
        const newWords = [...enteredWords];
        newWords[index] = value;
        setEnteredWords(newWords);
        setError("");
    };

    const handleVerify = () => {
        const allFilled = enteredWords.every((word) => word.trim() !== "");
        if (!allFilled) {
            setError("Please enter all words");
            return;
        }

        const isValid = checkWordIndexes.every(
            (wordIndex, i) =>
                words[wordIndex].toLowerCase() === enteredWords[i].toLowerCase().trim()
        );

        if (isValid) {
            useWalletStore.getState().saveSeedPhrase();
            onValid();
        } else {
            setError("Incorrect words. Please try again.");
        }
    };

    const onSkip = () => {
        useWalletStore.getState().saveSeedPhrase();
        onValid();
    };

    return (
        <>
            <SheetHeader>Check seed phrase</SheetHeader>
            <SheetBody className="flex flex-col gap-8 px-4">
                <div className="text-center text-zinc-400">
                    Enter the words in the correct order to verify your wallet seed phrase
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {checkWordIndexes.map((wordIndex, i) => (
                        <Input
                            key={i.toString()}
                            variant="bordered"
                            value={enteredWords[i]}
                            onValueChange={(value) => handleWordChange(i, value)}
                            startContent={
                                <div className="text-sm text-gray-500 w-4">{wordIndex + 1}.</div>
                            }
                            isInvalid={!!error}
                        />
                    ))}
                </div>
                {error && (
                    <div>
                        <Alert color="danger">{error}</Alert>
                    </div>
                )}
            </SheetBody>
            <SheetFooter className="flex justify-between">
                <div className="flex gap-2">
                    <Button variant="bordered" onPress={onBack}>
                        Back
                    </Button>
                    <Button variant="bordered" onPress={onSkip} color="danger">
                        Skip
                    </Button>
                </div>
                <Button color="primary" onPress={handleVerify}>
                    Next
                </Button>
            </SheetFooter>
        </>
    );
};
