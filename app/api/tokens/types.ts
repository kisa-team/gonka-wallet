export interface GonkaExchangeStatResponse {
    community_pool: number;
    epoch_id: number;
    genesis_accounts_count: number;
    genesis_in_vesting: number;
    genesis_total: number;
    genesis_unlocked: number;
    median_price_ask: number;
    median_price_bid: number;
    module_accounts_count: number;
    module_balance: number;
    total_mining_rewards: number;
    total_supply: number;
    updated_at: string;
    user_accounts_count: number;
    user_circulating: number;
    user_in_vesting: number;
    user_unlocked: number;
    volume_ask: number;
    volume_bid: number;
}

export interface DenomMetadata {
    description: string;
    denom_units: {
        denom: string;
        exponent: number;
        aliases: string[];
    }[];
    base: string;
    display: string;
    name: string;
    symbol: string;
    uri: string;
    uri_hash: string;
}

export interface DenomsMetadataResponse {
    metadatas: DenomMetadata[];
    pagination: {
        next_key: string | null;
        total: string;
    };
}
