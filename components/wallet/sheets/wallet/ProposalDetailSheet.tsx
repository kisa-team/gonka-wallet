"use client";
import { addToast, Button, Card, CardBody, Spinner } from "@heroui/react";
import type { FC } from "react";
import { useState } from "react";
import { IoCopy } from "react-icons/io5";
import type { Proposal } from "@/app/api/proposals/types";
import { formatDateTime, formatGonka } from "@/components/helpers";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { useCopyTextToClipboard } from "@/hooks/useCopyTextToClipboard";
import { useProposalVotes } from "@/hooks/wallet/useProposalVotes";
import { useVoteProposal, type VoteOptionType } from "@/hooks/wallet/useVoteProposal";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

interface ProposalDetailSheetProps {
    proposal: Proposal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const InfoRow: FC<{ label: string; value: string; copyValue?: string }> = ({
    label,
    value,
    copyValue,
}) => {
    const copy = useCopyTextToClipboard();

    const handleCopy = () => {
        if (copyValue) copy(copyValue);
    };

    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-500 text-sm">{label}</span>
            {copyValue ? (
                <button
                    type="button"
                    className="text-zinc-400 truncate max-w-[60%] text-right cursor-pointer hover:text-zinc-300 flex items-center gap-1 text-sm"
                    onClick={handleCopy}
                    title={copyValue}
                >
                    {value}
                    <IoCopy className="w-3 h-3 flex-shrink-0" />
                </button>
            ) : (
                <span
                    className="text-zinc-400 truncate max-w-[60%] text-right text-sm"
                    title={value}
                >
                    {value}
                </span>
            )}
        </div>
    );
};

const getStatusLabel = (status: string) => {
    if (status.includes("PASSED")) return "Passed";
    if (status.includes("REJECTED")) return "Rejected";
    if (status.includes("CANCELLED") || status.includes("CANCELED")) return "Cancelled";
    if (status.includes("DEPOSIT")) return "Deposit";
    if (status.includes("VOTING")) return "Voting";
    return status;
};

export const ProposalDetailSheet: FC<ProposalDetailSheetProps> = ({
    proposal,
    open,
    onOpenChange,
}) => {
    const { vote, status: voteStatus } = useVoteProposal();
    const userWallet = useWalletStore((state) => state.userWallet);
    const [selectedVote, setSelectedVote] = useState<VoteOptionType | null>(null);

    const isActive =
        proposal?.status === "PROPOSAL_STATUS_VOTING_PERIOD" ||
        proposal?.status === "2" ||
        proposal?.status?.includes("VOTING");

    const { votes, isLoading: isLoadingVotes } = useProposalVotes(
        proposal?.id || null,
        isActive || false
    );

    const isVoting =
        voteStatus === "signing" || voteStatus === "broadcasting" || voteStatus === "pending";
    const canVote = isActive && userWallet;

    const isDepositPeriod =
        proposal?.status === "PROPOSAL_STATUS_DEPOSIT_PERIOD" ||
        proposal?.status === "1" ||
        proposal?.status?.includes("DEPOSIT");

    const isProposer = proposal?.proposer === userWallet?.account.address;
    const canCancel = isDepositPeriod && isProposer && userWallet;

    const getStatusText = () => {
        switch (voteStatus) {
            case "signing":
                return "Signing transaction...";
            case "broadcasting":
                return "Broadcasting transaction...";
            case "pending":
                return "Waiting for confirmation...";
            case "success":
                return "Vote sent successfully";
            case "error":
                return "Error sending vote";
            default:
                return null;
        }
    };

    const handleVote = async (option: VoteOptionType) => {
        if (!proposal || !userWallet) return;

        setSelectedVote(option);
        const result = await vote(proposal.id, option);

        if (result.status === "success") {
            addToast({
                title: "Vote sent",
                description: "Your vote has been successfully registered",
                color: "success",
            });
            onOpenChange(false);
        }
        setSelectedVote(null);
    };

    if (!proposal) return null;

    const tallyResult = proposal.final_tally_result || proposal.tally_result;

    const totalVotes =
        Number(tallyResult?.yes_count || 0) +
        Number(tallyResult?.no_count || 0) +
        Number(tallyResult?.abstain_count || 0) +
        Number(tallyResult?.no_with_veto_count || 0);

    return (
        <Sheet open={open} onOpenChange={onOpenChange} side="right" parentSelector="#screens">
            <SheetHeader>Proposal #{proposal.id}</SheetHeader>
            <SheetBody className="px-4 py-4 space-y-4 overflow-y-auto">
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-100 mb-2">
                            {proposal.title}
                        </h2>
                        {proposal.summary.startsWith("http") ? (
                            <a
                                href={proposal.summary}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline break-all"
                            >
                                {proposal.summary}
                            </a>
                        ) : (
                            <p className="text-xs text-zinc-400 break-all">{proposal.summary}</p>
                        )}
                    </div>

                    <Card className="bg-zinc-800/50" shadow="none">
                        <CardBody className="p-4 space-y-2">
                            <InfoRow label="Status" value={getStatusLabel(proposal.status)} />
                            <InfoRow
                                label="Proposer"
                                value={proposal.proposer}
                                copyValue={proposal.proposer}
                            />
                            <InfoRow
                                label="Submit Time"
                                value={formatDateTime(proposal.submit_time)}
                            />
                            <InfoRow
                                label="Voting Start"
                                value={formatDateTime(proposal.voting_start_time)}
                            />
                            <InfoRow
                                label="Voting End"
                                value={formatDateTime(proposal.voting_end_time)}
                            />
                            <InfoRow
                                label="Deposit End"
                                value={formatDateTime(proposal.deposit_end_time)}
                            />
                            {proposal.total_deposit && proposal.total_deposit.length > 0 && (
                                <InfoRow
                                    label="Total Deposit"
                                    value={formatGonka(
                                        proposal.total_deposit[0].amount,
                                        proposal.total_deposit[0].denom
                                    )}
                                />
                            )}
                            {proposal.expedited && <InfoRow label="Expedited" value="Yes" />}
                            {proposal.failed_reason && (
                                <InfoRow label="Failed Reason" value={proposal.failed_reason} />
                            )}
                            {isDepositPeriod && (
                                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-blue-400">
                                        Proposal is in the deposit period. After the voting starts,
                                        it will not be possible to cancel it.
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {isActive && (
                        <Card className="bg-zinc-800/50" shadow="none">
                            <CardBody className="p-4">
                                <h3 className="text-sm font-semibold text-zinc-100 mb-2">
                                    Votes (count)
                                </h3>
                                {isLoadingVotes ? (
                                    <div className="flex items-center gap-2 py-4">
                                        <Spinner size="sm" color="primary" />
                                        <span className="text-xs text-zinc-500">
                                            Loading votes...
                                        </span>
                                    </div>
                                ) : votes && votes.total > 0 ? (
                                    <div className="space-y-3">
                                        {votes.yes > 0 && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-zinc-400">
                                                        Yes
                                                    </span>
                                                    <span className="text-xs text-zinc-300">
                                                        {votes.yes} (
                                                        {((votes.yes / votes.total) * 100).toFixed(
                                                            1
                                                        )}
                                                        %)
                                                    </span>
                                                </div>
                                                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500"
                                                        style={{
                                                            width: `${(votes.yes / votes.total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {votes.no > 0 && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-zinc-400">
                                                        No
                                                    </span>
                                                    <span className="text-xs text-zinc-300">
                                                        {votes.no} (
                                                        {((votes.no / votes.total) * 100).toFixed(
                                                            1
                                                        )}
                                                        %)
                                                    </span>
                                                </div>
                                                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-500"
                                                        style={{
                                                            width: `${(votes.no / votes.total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {votes.abstain > 0 && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-zinc-400">
                                                        Abstain
                                                    </span>
                                                    <span className="text-xs text-zinc-300">
                                                        {votes.abstain} (
                                                        {(
                                                            (votes.abstain / votes.total) *
                                                            100
                                                        ).toFixed(1)}
                                                        %)
                                                    </span>
                                                </div>
                                                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-500"
                                                        style={{
                                                            width: `${(votes.abstain / votes.total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {votes.no_with_veto > 0 && (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-zinc-400">
                                                        No With Veto
                                                    </span>
                                                    <span className="text-xs text-zinc-300">
                                                        {votes.no_with_veto} (
                                                        {(
                                                            (votes.no_with_veto / votes.total) *
                                                            100
                                                        ).toFixed(1)}
                                                        %)
                                                    </span>
                                                </div>
                                                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-500"
                                                        style={{
                                                            width: `${(votes.no_with_veto / votes.total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                                            Total votes: {votes.total}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-zinc-500 py-2">No votes yet</div>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {tallyResult && totalVotes > 0 && (
                        <Card className="bg-zinc-800/50" shadow="none">
                            <CardBody className="p-4">
                                <h3 className="text-sm font-semibold text-zinc-100 mb-2">
                                    Voting Results (tokens)
                                </h3>
                                <div className="space-y-3">
                                    {Number(tallyResult.yes_count) > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-400">Yes</span>
                                                <span className="text-xs text-zinc-300">
                                                    {formatGonka(tallyResult.yes_count)} (
                                                    {(
                                                        (Number(tallyResult.yes_count) /
                                                            totalVotes) *
                                                        100
                                                    ).toFixed(1)}
                                                    %)
                                                </span>
                                            </div>
                                            <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{
                                                        width: `${
                                                            (Number(tallyResult.yes_count) /
                                                                totalVotes) *
                                                            100
                                                        }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {Number(tallyResult.no_count) > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-400">No</span>
                                                <span className="text-xs text-zinc-300">
                                                    {formatGonka(tallyResult.no_count)} (
                                                    {(
                                                        (Number(tallyResult.no_count) /
                                                            totalVotes) *
                                                        100
                                                    ).toFixed(1)}
                                                    %)
                                                </span>
                                            </div>
                                            <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500"
                                                    style={{
                                                        width: `${
                                                            (Number(tallyResult.no_count) /
                                                                totalVotes) *
                                                            100
                                                        }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {Number(tallyResult.abstain_count) > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-400">
                                                    Abstain
                                                </span>
                                                <span className="text-xs text-zinc-300">
                                                    {formatGonka(tallyResult.abstain_count)} (
                                                    {(
                                                        (Number(tallyResult.abstain_count) /
                                                            totalVotes) *
                                                        100
                                                    ).toFixed(1)}
                                                    %)
                                                </span>
                                            </div>
                                            <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-500"
                                                    style={{
                                                        width: `${
                                                            (Number(tallyResult.abstain_count) /
                                                                totalVotes) *
                                                            100
                                                        }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {Number(tallyResult.no_with_veto_count) > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-400">
                                                    No With Veto
                                                </span>
                                                <span className="text-xs text-zinc-300">
                                                    {formatGonka(tallyResult.no_with_veto_count)} (
                                                    {(
                                                        (Number(tallyResult.no_with_veto_count) /
                                                            totalVotes) *
                                                        100
                                                    ).toFixed(1)}
                                                    %)
                                                </span>
                                            </div>
                                            <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500"
                                                    style={{
                                                        width: `${
                                                            (Number(
                                                                tallyResult.no_with_veto_count
                                                            ) /
                                                                totalVotes) *
                                                            100
                                                        }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {canVote && (
                        <Card className="bg-zinc-800/50" shadow="none">
                            <CardBody className="p-4">
                                <h3 className="text-sm font-semibold text-zinc-100 mb-3">Vote</h3>
                                {isVoting && getStatusText() && (
                                    <div className="flex items-center gap-2 mb-3 p-2 bg-zinc-700/50 rounded-lg">
                                        <Spinner size="sm" color="primary" />
                                        <span className="text-xs text-zinc-300">
                                            {getStatusText()}
                                        </span>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        color="success"
                                        variant="flat"
                                        onPress={() => handleVote("yes")}
                                        isDisabled={isVoting}
                                        isLoading={selectedVote === "yes" && isVoting}
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        color="danger"
                                        variant="flat"
                                        onPress={() => handleVote("no")}
                                        isDisabled={isVoting}
                                        isLoading={selectedVote === "no" && isVoting}
                                    >
                                        No
                                    </Button>
                                    <Button
                                        color="default"
                                        variant="flat"
                                        onPress={() => handleVote("abstain")}
                                        isDisabled={isVoting}
                                        isLoading={selectedVote === "abstain" && isVoting}
                                    >
                                        Abstain
                                    </Button>
                                    <Button
                                        color="warning"
                                        variant="flat"
                                        onPress={() => handleVote("no_with_veto")}
                                        isDisabled={isVoting}
                                        isLoading={selectedVote === "no_with_veto" && isVoting}
                                    >
                                        No With Veto
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {proposal.metadata && (
                        <Card className="bg-zinc-800/50" shadow="none">
                            <CardBody className="p-4">
                                <h3 className="text-sm font-semibold text-zinc-100 mb-2">
                                    Metadata
                                </h3>
                                {proposal.metadata.startsWith("http") ? (
                                    <a
                                        href={proposal.metadata}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline break-all"
                                    >
                                        {proposal.metadata}
                                    </a>
                                ) : (
                                    <p className="text-xs text-zinc-400 break-all">
                                        {proposal.metadata}
                                    </p>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </div>
            </SheetBody>
            <SheetFooter></SheetFooter>
        </Sheet>
    );
};
