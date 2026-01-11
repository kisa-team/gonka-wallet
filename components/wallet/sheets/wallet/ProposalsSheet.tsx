"use client";
import { Card, CardBody, Spinner, Tab, Tabs } from "@heroui/react";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import type { Proposal } from "@/app/api/proposals/types";
import { formatDateTime, formatTokens } from "@/components/helpers";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "@/components/ui/Sheet";
import { ProposalDetailSheet } from "@/components/wallet/sheets/wallet/ProposalDetailSheet";
import { useProposals } from "@/hooks/wallet/useProposals";
import { useProposalVotes } from "@/hooks/wallet/useProposalVotes";
import { useWalletStore } from "@/hooks/wallet/useWalletStore";

const ProposalItem: FC<{ proposal: Proposal; onClick: () => void; isActive?: boolean }> = ({
    proposal,
    onClick,
    isActive = false,
}) => {
    const isProposalActive =
        proposal.status === "PROPOSAL_STATUS_VOTING_PERIOD" ||
        proposal.status === "2" ||
        proposal.status?.includes("VOTING");

    const shouldLoadVotes = isActive && isProposalActive;
    const { votes, isLoading: isLoadingVotes } = useProposalVotes(proposal.id, shouldLoadVotes);

    const tallyResult = proposal.final_tally_result || proposal.tally_result;

    const totalVotesTokens =
        Number(tallyResult?.yes_count || 0) +
        Number(tallyResult?.no_count || 0) +
        Number(tallyResult?.abstain_count || 0) +
        Number(tallyResult?.no_with_veto_count || 0);

    const hasVotesTokens = totalVotesTokens > 0 && tallyResult;

    return (
        <Card className="bg-zinc-800/50 mb-3" shadow="none" isPressable onPress={onClick}>
            <CardBody className="p-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-zinc-100 text-sm line-clamp-2 flex-1">
                            {proposal.title || `Proposal #${proposal.id}`}
                        </h3>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                            #{proposal.id}
                        </span>
                    </div>
                    {proposal.summary && (
                        <p className="text-xs text-zinc-400 line-clamp-2">{proposal.summary}</p>
                    )}
                    {shouldLoadVotes && (
                        <div className="flex flex-col gap-1.5 mt-1">
                            <div className="text-xs text-zinc-500 mb-0.5">Votes (count):</div>
                            {isLoadingVotes ? (
                                <div className="flex items-center gap-2">
                                    <Spinner size="sm" color="primary" />
                                    <span className="text-xs text-zinc-500">Loading votes...</span>
                                </div>
                            ) : votes && votes.total > 0 ? (
                                <>
                                    {votes.yes > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{
                                                        width: `${(votes.yes / votes.total) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                                Yes: {votes.yes}
                                            </span>
                                        </div>
                                    )}
                                    {votes.no > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500"
                                                    style={{
                                                        width: `${(votes.no / votes.total) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                                No: {votes.no}
                                            </span>
                                        </div>
                                    )}
                                    {votes.abstain > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-500"
                                                    style={{
                                                        width: `${(votes.abstain / votes.total) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                                Abstain: {votes.abstain}
                                            </span>
                                        </div>
                                    )}
                                    {votes.no_with_veto > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500"
                                                    style={{
                                                        width: `${(votes.no_with_veto / votes.total) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                                NoWithVeto: {votes.no_with_veto}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-xs text-zinc-500 mt-0.5">
                                        Total: {votes.total}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}
                    {hasVotesTokens && tallyResult && (
                        <div className="flex flex-col gap-1.5 mt-1">
                            <div className="text-xs text-zinc-500 mb-0.5">Votes (tokens):</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{
                                            width: `${(Number(tallyResult.yes_count) / totalVotesTokens) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                    Yes: {formatTokens(tallyResult.yes_count)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500"
                                        style={{
                                            width: `${(Number(tallyResult.no_count) / totalVotesTokens) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                    No: {formatTokens(tallyResult.no_count)}
                                </span>
                            </div>
                            {Number(tallyResult.abstain_count) > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500"
                                            style={{
                                                width: `${(Number(tallyResult.abstain_count) / totalVotesTokens) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                        Abstain: {formatTokens(tallyResult.abstain_count)}
                                    </span>
                                </div>
                            )}
                            {Number(tallyResult.no_with_veto_count) > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500"
                                            style={{
                                                width: `${(Number(tallyResult.no_with_veto_count) / totalVotesTokens) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                                        NoWithVeto: {formatTokens(tallyResult.no_with_veto_count)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-zinc-500">
                            {proposal.voting_end_time
                                ? `Ends: ${formatDateTime(proposal.voting_end_time)}`
                                : formatDateTime(proposal.submit_time)}
                        </span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

const ProposalsList: FC<{
    type: "active" | "passed" | "rejected";
    onProposalClick: (proposal: Proposal) => void;
}> = ({ type, onProposalClick }) => {
    const { proposals, isLoadingInitial, isLoadingMore, isEmpty, isReachingEnd, setSize } =
        useProposals(type);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !isReachingEnd && !isLoadingMore) {
                    setSize((prev) => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [isReachingEnd, isLoadingMore, setSize]);

    if (isLoadingInitial) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spinner size="lg" color="primary" variant="wave" />
            </div>
        );
    }

    if (isEmpty) {
        return <div className="text-center text-zinc-400 py-8">No proposals found</div>;
    }

    return (
        <div className="flex flex-col">
            {proposals.map((proposal) => (
                <ProposalItem
                    key={proposal.id}
                    proposal={proposal}
                    onClick={() => onProposalClick(proposal)}
                    isActive={type === "active"}
                />
            ))}
            <div ref={loadMoreRef} className="h-1" />
            {isLoadingMore && (
                <div className="flex justify-center py-4">
                    <Spinner size="sm" color="primary" />
                </div>
            )}
            {isReachingEnd && proposals.length > 0 && (
                <div className="text-center text-zinc-500 text-sm py-2">No more proposals</div>
            )}
        </div>
    );
};

export const ProposalsSheet: FC = () => {
    const isOpen = useWalletStore((s) => s.sheets.proposals);
    const isOpenDetail = useWalletStore((s) => s.sheets.proposalDetail);
    const [selectedTab, setSelectedTab] = useState<"active" | "passed" | "rejected">("active");
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

    const onClickProposal = (proposal: Proposal) => {
        setSelectedProposal(proposal);
        useWalletStore.getState().openSheet("proposalDetail");
    };

    return (
        <>
            <Sheet
                open={isOpen}
                onOpenChange={(open) => useWalletStore.getState().toggleSheet("proposals", open)}
                side="bottom"
                parentSelector="#screens"
            >
                <SheetHeader>Governance Proposals</SheetHeader>
                <SheetBody className="px-4 py-4 flex flex-col min-h-0">
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) =>
                            setSelectedTab(key as "active" | "passed" | "rejected")
                        }
                        aria-label="Proposal types"
                        classNames={{
                            base: "w-full flex flex-col",
                            tabList: "w-full shrink-0",
                            panel: "overflow-y-auto mt-4 pt-0",
                        }}
                    >
                        <Tab key="active" title="Active">
                            <ProposalsList type="active" onProposalClick={onClickProposal} />
                        </Tab>
                        <Tab key="passed" title="Passed">
                            <ProposalsList type="passed" onProposalClick={onClickProposal} />
                        </Tab>
                        <Tab key="rejected" title="Rejected">
                            <ProposalsList type="rejected" onProposalClick={onClickProposal} />
                        </Tab>
                    </Tabs>
                </SheetBody>
                <SheetFooter></SheetFooter>
            </Sheet>
            <ProposalDetailSheet
                proposal={selectedProposal}
                open={isOpenDetail}
                onOpenChange={(open) => {
                    if (!open) useWalletStore.getState().closeSheet("proposalDetail");
                }}
            />
        </>
    );
};
