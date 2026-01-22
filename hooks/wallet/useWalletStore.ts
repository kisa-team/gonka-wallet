import { type Coin, StargateClient } from "@cosmjs/stargate";
import { create, type Mutate, type StoreApi, type UseBoundStore } from "zustand";
import type { TokenMetadata, TokensApiResponse } from "@/app/api/tokens/route";
import { getJson } from "@/src/utils/fetch-helpers";
import type { UserWallet } from "@/src/utils/wallet/CosmosWallet";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";
import { WalletConnectService } from "@/src/utils/wallet-connect-service/WalletConnectService";

export enum WalletScreen {
    LOADING = "LOADING",
    WELCOME = "WELCOME",
    MAIN = "MAIN",
    HISTORY = "HISTORY",
    APPS = "APPS",
}

type WalletSheet =
    | "create"
    | "checkSeed"
    | "importSeed"
    | "receive"
    | "send"
    | "settings"
    | "connect"
    | "scanQR"
    | "validator"
    | "validators"
    | "grantMLOps"
    | "proposals"
    | "proposalDetail"
    | "token";

export interface WalletState {
    screen: WalletScreen;
    showScreen: (screen: WalletScreen) => void;
    showPreviousScreen: () => void;

    sheets: Record<WalletSheet, boolean>;
    openSheet: (sheet: WalletSheet) => void;
    closeSheet: (sheet: WalletSheet) => void;
    toggleSheet: (sheet: WalletSheet, open: boolean) => void;

    seedPhrase: string;
    creatingSeedPhrase: string;
    generateSeedPhrase: () => void;
    saveSeedPhrase: (seedPhrase?: string) => Promise<void>;
    resetSeedPhrase: () => void;
    loadSeedPhrase: () => Promise<void>;

    walletConnectService: WalletConnectService | null;
    initializeWalletConnectService: () => Promise<void>;

    rpcClient: StargateClient | null;
    initRpcClient: () => Promise<void>;

    userWallet: UserWallet | null;
    balanceNgonka: number;
    balanceGonka: number;
    isTokensLoading: boolean;
    gonkaToken: TokenMetadata | null;
    selectedToken: TokenMetadata | null;
    setSelectedToken: (token?: TokenMetadata) => void;
    updateTokens: () => Promise<void>;
    balances: Coin[];
    updateBalance: () => Promise<void>;
    tokensMetadata: TokenMetadata[];
    updateTokensMetadata: () => Promise<void>;

    selectedAppId: number | null;
    setSelectedAppId: (id: number | null) => void;
}

const GONKA_WALLET_SEED_PHRASE_KEY = "gonka_wallet_seed_phrase";
const screenHistory: WalletScreen[] = [];

export const getLocalStorage: () => Storage | undefined = () => {
    return typeof window === "undefined" ? undefined : window.localStorage;
};

export const getLocation: () => Location | undefined = () => {
    return typeof window === "undefined" ? undefined : window.location;
};

let gonkaRPCClient: StargateClient | undefined;
let gonkaRPCClientPromise: Promise<StargateClient> | undefined;
export const getRPCClient: () => Promise<StargateClient> = async () => {
    if (typeof window === "undefined") {
        throw new Error("window is not defined");
    }
    if (gonkaRPCClient) {
        return gonkaRPCClient;
    }
    if (gonkaRPCClientPromise) {
        return gonkaRPCClientPromise;
    }
    gonkaRPCClientPromise = StargateClient.connect(
        `${window.location.origin}/api/node/8443/chain-rpc/`
    );
    gonkaRPCClient = await gonkaRPCClientPromise;
    return gonkaRPCClient;
};

async function loadUserWallet(seedPhrase: string): Promise<UserWallet | null> {
    if (!seedPhrase) {
        return null;
    }
    const wallet = new GonkaWallet();
    wallet.setMasterSeed(seedPhrase);
    return await wallet.createWallet();
}

export const useWalletStore: UseBoundStore<Mutate<StoreApi<WalletState>, []>> = create(
    (set, get) => ({
        screen: WalletScreen.LOADING,
        showScreen: (screen: WalletScreen) =>
            set((state) => {
                if (state.screen === screen) {
                    return {};
                }
                screenHistory.push(state.screen);
                return { screen };
            }),
        showPreviousScreen: () =>
            set(() => {
                const screen = screenHistory.pop();
                if (screen !== undefined) {
                    return { screen };
                }
                return {};
            }),

        sheets: {
            create: false,
            checkSeed: false,
            importSeed: false,
            receive: false,
            send: false,
            settings: false,
            connect: false,
            scanQR: false,
            validator: false,
            validators: false,
            grantMLOps: false,
            proposals: false,
            proposalDetail: false,
            token: false,
        },
        openSheet: (sheet) => set((s) => ({ sheets: { ...s.sheets, [sheet]: true } })),
        closeSheet: (sheet) => set((s) => ({ sheets: { ...s.sheets, [sheet]: false } })),
        toggleSheet: (sheet, open) => set((s) => ({ sheets: { ...s.sheets, [sheet]: open } })),

        seedPhrase: "",
        creatingSeedPhrase: "",
        generateSeedPhrase: () =>
            set(() => {
                const wallet = new GonkaWallet();
                const creatingSeedPhrase = wallet.generateMasterSeed();
                return { creatingSeedPhrase };
            }),
        saveSeedPhrase: async (seedPhrase?: string) => {
            const seedPhraseToSave = seedPhrase || get().creatingSeedPhrase;
            if (seedPhraseToSave) {
                const wallet = await loadUserWallet(seedPhraseToSave);
                if (wallet) {
                    getLocalStorage()?.setItem(GONKA_WALLET_SEED_PHRASE_KEY, seedPhraseToSave);
                    set({ userWallet: wallet, seedPhrase: seedPhraseToSave });
                }
            }
        },
        resetSeedPhrase: () =>
            set(() => {
                getLocalStorage()?.removeItem(GONKA_WALLET_SEED_PHRASE_KEY);
                return {
                    seedPhrase: "",
                    creatingSeedPhrase: "",
                    screen: WalletScreen.WELCOME,
                    userWallet: null,
                };
            }),
        loadSeedPhrase: async () => {
            const seedPhrase = getLocalStorage()?.getItem(GONKA_WALLET_SEED_PHRASE_KEY) || "";
            if (!seedPhrase) {
                set({ screen: WalletScreen.WELCOME });
                return;
            }
            const wallet = await loadUserWallet(seedPhrase);
            if (wallet) {
                set({ userWallet: wallet, seedPhrase, screen: WalletScreen.MAIN });
            } else {
                set({ screen: WalletScreen.WELCOME });
            }
        },

        walletConnectService: null,
        initializeWalletConnectService: async () => {
            const walletConnectService = WalletConnectService.getInstance();
            await walletConnectService.initialize();
            set({ walletConnectService });
        },

        rpcClient: null,
        initRpcClient: async () => set({ rpcClient: await getRPCClient() }),

        userWallet: null,
        balanceNgonka: 0,
        balanceGonka: 0,
        priceGonka: 0,
        isTokensLoading: false,
        gonkaToken: null,
        selectedToken: null,
        setSelectedToken: (token?: TokenMetadata) => {
            const { gonkaToken } = get();
            set({ selectedToken: token || gonkaToken });
        },
        updateTokens: async () => {
            const { rpcClient, userWallet, updateBalance, updateTokensMetadata } = get();
            if (!rpcClient || !userWallet?.account.address) return;

            set({ isTokensLoading: true });
            try {
                await Promise.all([updateBalance(), updateTokensMetadata()]);
            } finally {
                set({ isTokensLoading: false });
            }
        },
        balances: [],
        updateBalance: async () => {
            const { rpcClient, userWallet } = get();
            if (!rpcClient || !userWallet?.account.address) return;

            const allBalancesResult = await rpcClient.getAllBalances(userWallet.account.address);
            const balanceNgonka = parseFloat(
                allBalancesResult.find((balance) => balance.denom === "ngonka")?.amount || "0"
            );
            const balanceGonka = balanceNgonka / GonkaWallet.NGONKA_TO_GONKA;
            set({ balances: Array.from(allBalancesResult), balanceNgonka, balanceGonka });
        },
        tokensMetadata: [],
        updateTokensMetadata: async () => {
            const { selectedToken } = get();
            const { tokens } = await getJson<TokensApiResponse>("/api/tokens");
            if (!selectedToken) {
                const gonkaToken = tokens.find((token) => token.base === "ngonka") || null;
                set({
                    tokensMetadata: tokens,
                    selectedToken: gonkaToken,
                    gonkaToken: gonkaToken,
                });
            }
            set({ tokensMetadata: tokens });
        },
        selectedAppId: null,
        setSelectedAppId: (selectedAppId: number | null) => set({ selectedAppId }),
    })
);
