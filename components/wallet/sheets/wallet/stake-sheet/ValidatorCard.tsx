"use client";
import { Card, CardBody, Tooltip } from "@heroui/react";
import type { FC } from "react";
import { PiCheckCircle, PiGift, PiLock, PiPercent, PiStarFill } from "react-icons/pi";
import type { ValidatorWithStats } from "@/app/api/validators/types";
import { formatCommission, formatTokens } from "@/components/helpers";

interface ValidatorCardProps {
    validator: ValidatorWithStats;
    onClickValidator: (validator: ValidatorWithStats) => void;
}

export const ValidatorCard: FC<ValidatorCardProps> = ({ validator, onClickValidator }) => {
    const title =
        validator.stats.operator_address === validator.operator_address &&
        validator.operator_address !== validator.description?.moniker
            ? validator.description?.moniker || "Unknown"
            : validator.stats.account_address;

    const subtitle = validator.description?.website || "";

    return (
        <Card
            key={validator.operator_address}
            className="bg-zinc-800/50 shrink-0"
            shadow="none"
            isPressable
            onPress={() => onClickValidator(validator)}
        >
            <CardBody className="p-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-semibold text-zinc-100 truncate">
                        {validator.jailed && (
                            <Tooltip content="Jailed">
                                <div className="flex items-center gap-1">
                                    <PiLock className="w-5 h-5 text-red-500" />
                                </div>
                            </Tooltip>
                        )}
                        {title}
                    </div>
                    <div className="text-zinc-500 text-sm truncate">{subtitle}</div>
                    <div className="flex justify-between items-center gap-3 mt-1 flex-wrap text-sm text-zinc-400">
                        <Tooltip content="Latest epoch reward">
                            <div className="flex items-center gap-1">
                                <PiGift className="w-5 h-5 text-purple-500" />
                                {formatTokens(validator.stats.rewarded_coins_latest_epoch)}
                            </div>
                        </Tooltip>
                        <Tooltip content="Epochs completed">
                            <div className="flex items-center gap-1">
                                <PiCheckCircle className="w-5 h-5 " />
                                {validator.stats.epochs_completed}
                            </div>
                        </Tooltip>
                        <Tooltip content="Commission">
                            <div className="flex items-center gap-1">
                                <PiPercent className="w-5 h-5 " />
                                {formatCommission(validator.commission.commission_rates.rate)}
                            </div>
                        </Tooltip>
                        {/* <Tooltip content="Staked">
                                <div className="flex items-center gap-1">
                                    <PiCoins className="w-5 h-5 text-green-500" />
                                    {formatTokens(validator.tokens)}
                                </div>
                            </Tooltip> */}
                        <Tooltip content="Reputation">
                            <div className="flex items-center gap-1">
                                <PiStarFill className="w-5 h-5" />
                                {validator.stats.reputation}
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};
