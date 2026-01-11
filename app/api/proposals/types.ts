export interface TallyResult {
    yes_count: string;
    abstain_count: string;
    no_count: string;
    no_with_veto_count: string;
}

export interface Proposal {
    id: string;
    messages: unknown[];
    status: string;
    final_tally_result?: TallyResult;
    tally_result?: TallyResult;
    submit_time: string;
    deposit_end_time: string;
    total_deposit: Array<{
        denom: string;
        amount: string;
    }>;
    voting_start_time: string;
    voting_end_time: string;
    metadata: string;
    title: string;
    summary: string;
    proposer: string;
    expedited: boolean;
    failed_reason: string;
    [key: string]: unknown;
}

export interface ProposalsResponse {
    proposals: Proposal[];
    nextCursor: string | null;
    hasMore: boolean;
    total: string | null;
}

export interface Vote {
    proposal_id: string;
    voter: string;
    options: Array<{
        option: string;
        weight: string;
    }>;
    metadata: string;
}

export interface VotesResponse {
    votes: Vote[];
    pagination?: {
        next_key: string | null;
        total: string;
    };
}

export interface VoteCounts {
    yes: number;
    no: number;
    abstain: number;
    no_with_veto: number;
    total: number;
}

export interface CosmosApiResponse {
    proposals?: Proposal[];
    pagination?: {
        next_key: string | null;
        total: string;
    };
}
