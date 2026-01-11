export interface Validator {
    operator_address: string;
    consensus_pubkey?: {
        "@type": string;
        key: string;
    };
    jailed: boolean;
    status: string;
    tokens: string;
    delegator_shares: string;
    description?: {
        moniker?: string;
        identity?: string;
        website?: string;
        security_contact?: string;
        details?: string;
    };
    unbonding_height?: string;
    unbonding_time?: string;
    commission: {
        commission_rates: {
            rate: string;
            max_rate: string;
            max_change_rate: string;
        };
        update_time: string;
    };
    min_self_delegation: string;
    unbonding_on_hold_ref_count?: string;
    unbonding_ids?: string[];
    [key: string]: unknown;
}

export interface ChainApiValidatorsResponse {
    validators?: Validator[];
    pagination?: {
        next_key: string | null;
        total: string;
    };
}

export interface ParticipantStats {
    account_address: string;
    operator_address: string;
    reputation: number;
    earned_coins_current_epoch: string;
    rewarded_coins_latest_epoch: string;
    epochs_completed: number;
}

export interface ChainApiParticipantsStatsResponse {
    participants_stats?: ParticipantStats[];
    pagination?: {
        next_key: string | null;
        total: string;
    };
}

export type ValidatorWithStats = Validator & { stats: ParticipantStats };

export interface ValidatorsWithStatsResponse {
    validators: ValidatorWithStats[];
}
