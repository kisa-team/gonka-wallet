import type { SignClientTypes } from "@walletconnect/types";

export interface WCSEventSessionProposal {
    proposal: SignClientTypes.EventArguments["session_proposal"];
    approve: (userWallet: { address: string }) => Promise<void>;
    reject: () => Promise<void>;
}

export interface WCSEventSessionRequest {
    request: SignClientTypes.EventArguments["session_request"];
    method: string;
    approve: () => Promise<void>;
    reject: () => Promise<void>;
}

export interface WCSEventCosmosSignDirect {
    topic: string;
    id: number;
    signerAddress: string;
    signDoc: any;
    approve: () => Promise<void>;
    reject: () => Promise<void>;
}

export interface WCSEventCosmosSignAmino {
    topic: string;
    id: number;
    signerAddress: string;
    signDoc: any;
    approve: () => Promise<void>;
    reject: () => Promise<void>;
}

export interface WCSEvents {
    sessionProposal: WCSEventSessionProposal;
    sessionRequest: WCSEventSessionRequest;
    cosmosSignDirect: WCSEventCosmosSignDirect;
    cosmosSignAmino: WCSEventCosmosSignAmino;
    sessionDelete: SignClientTypes.EventArguments["session_delete"];
    sessionExpire: SignClientTypes.EventArguments["session_expire"];
}
