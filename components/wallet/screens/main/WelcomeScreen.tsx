"use client";
import { Card, CardBody, Chip } from "@heroui/react";
import type { FC } from "react";
import { FaArrowRightToBracket, FaCirclePlus, FaKey } from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

export const WelcomeScreen: FC = () => {
    const cards = [
        {
            title: "New wallet",
            description: "Create a new wallet",
            icon: <FaCirclePlus className="w-6 h-6 text-primary" />,
            action: () => useWalletStore.getState().openSheet("create"),
            isDisabled: false,
        },
        {
            title: "Import seed phrase",
            description: "Import existing wallet with a 24 words seed phrase",
            icon: <FaArrowRightToBracket className="w-6 h-6 text-primary" />,
            action: () => useWalletStore.getState().openSheet("importSeed"),
            isDisabled: false,
        },
        {
            title: "Import private key",
            description: "Import existing wallet with a private key",
            icon: <FaKey className="w-6 h-6 text-primary" />,
            action: () => useWalletStore.getState().openSheet("importSeed"),
            isDisabled: true,
        },
    ];

    const renderCards = () => {
        return cards.map((card) => (
            <Card
                key={card.title}
                className="w-full"
                isPressable={!card.isDisabled}
                onPress={card.isDisabled ? undefined : card.action}
                isDisabled={card.isDisabled}
            >
                <CardBody>
                    <div className="flex items-center gap-4">
                        <div>{card.icon}</div>
                        <div className="w-full">
                            <div className="flex items-center gap-2">
                                <div className="font-medium">{card.title}</div>
                                {card.isDisabled && (
                                    <Chip size="sm" color="primary" variant="bordered">
                                        Soon
                                    </Chip>
                                )}
                            </div>
                            <div className="text-sm text-zinc-400">{card.description}</div>
                        </div>
                        <div>
                            <IoIosArrowForward className="w-6 h-6 text-zinc-600" />
                        </div>
                    </div>
                </CardBody>
            </Card>
        ));
    };

    return (
        <div className="flex flex-col gap-8 p-6 pb-6 h-full overflow-y-auto">
            <div className="flex flex-col gap-2 ">
                <div className="text-center text-2xl font-medium">Create wallet</div>
                <div className="text-center text-zinc-400">
                    Create new wallet or import existing one
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4">{renderCards()}</div>
        </div>
    );
};
