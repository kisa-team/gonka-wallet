import { makeSignDoc, Secp256k1HdWallet } from "@cosmjs/amino";
import { stringToPath } from "@cosmjs/crypto";
import SignClient from "@walletconnect/sign-client";
import type { SignClientTypes } from "@walletconnect/types";
import Events from "@/src/utils/events/Events";
import type { UserWallet } from "@/src/utils/wallet/CosmosWallet";
import type { WCSEvents } from "@/src/utils/wallet-connect-service/WalletConnectServiceEvents";

const GONKA_HD_PATH = "m/44'/1200'/0'/0/0";
const GONKA_PREFIX = "gonka";

interface WalletConnectErrorResponse {
    code: number;
    message: string;
}

const WC_ERRORS = {
    WALLET_NOT_INITIALIZED: { code: 5000, message: "Wallet not initialized" },
    USER_REJECTED: { code: 5001, message: "User rejected the request" },
    UNSUPPORTED_METHOD: (method: string) => ({
        code: 5002,
        message: `Unsupported method: ${method}`,
    }),
    INVALID_PARAMS: (method: string) => ({ code: 5003, message: `Invalid params for ${method}` }),
    SIGNING_FAILED: (error: unknown) => ({
        code: 5004,
        message: error instanceof Error ? error.message : "Signing failed",
    }),
    NO_HANDLER: { code: 5005, message: "No handler registered for this event" },
} as const;

export class WalletConnectService {
    private static instance: WalletConnectService;
    private client?: SignClient;
    private initializing = false;
    public events = new Events<WCSEvents>();
    public wallet: UserWallet | null = null;

    private constructor() {}

    public static getInstance(): WalletConnectService {
        if (!WalletConnectService.instance) {
            WalletConnectService.instance = new WalletConnectService();
        }
        return WalletConnectService.instance;
    }

    public isInitialized(): boolean {
        return !!this.client;
    }

    public getClient(): SignClient {
        if (!this.client) {
            throw new Error("WalletConnect client is not initialized");
        }
        return this.client;
    }

    public async initialize() {
        if (this.client || typeof window === "undefined" || !window.location.origin) {
            return;
        }

        if (this.initializing) {
            while (this.initializing) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return;
        }

        this.initializing = true;

        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        const projectName = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_NAME;
        const projectDescription = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_DESCRIPTION;

        if (!projectId || !projectName || !projectDescription) {
            this.initializing = false;
            throw new Error("WalletConnect environment variables are not set");
        }

        const currentUrl = window.location.origin;

        this.client = await SignClient.init({
            projectId,
            relayUrl: "wss://relay.walletconnect.com",
            metadata: {
                name: projectName,
                description: projectDescription,
                url: currentUrl,
                icons: [`${currentUrl}/images/logo.png`],
            },
        });

        this.registerEventHandlers();
        this.initializing = false;

        this.log("initialized");
    }

    public async onConnection(uri: string) {
        this.log("onConnection()", { uri });
        await this.getClient().pair({ uri });
    }

    public setWallet(wallet: UserWallet | null) {
        this.wallet = wallet;
    }

    private registerEventHandlers() {
        this.getClient().on("session_proposal", (event) => this.onSessionProposal(event));
        this.getClient().on("session_request", (event) => this.onSessionRequest(event));
        this.getClient().on("session_delete", (event) => this.onSessionDelete(event));
        this.getClient().on("session_expire", (event) => this.onSessionExpire(event));
    }

    private async onSessionProposal(event: SignClientTypes.EventArguments["session_proposal"]) {
        this.log("onSessionProposal()", { event });

        const hasListeners = this.events.getEvent("sessionProposal").getListenersCount() > 0;
        if (!hasListeners) {
            this.log("No handler for sessionProposal, rejecting proposal");
            try {
                await this.getClient().reject({
                    id: event.id,
                    reason: WC_ERRORS.NO_HANDLER,
                });
            } catch (error) {
                this.log("Error rejecting proposal", error);
            }
            return;
        }

        const approve = async (userWallet: { address: string }) => {
            try {
                const ns = event.params.optionalNamespaces;
                const accounts = (ns.cosmos.chains || []).map(
                    (chainId: string) => `${chainId}:${userWallet.address}`
                );

                await this.getClient().approve({
                    id: event.id,
                    namespaces: {
                        cosmos: {
                            accounts,
                            methods: ns.cosmos.methods,
                            events: ns.cosmos.events,
                        },
                    },
                });
                this.log("Session proposal approved", { id: event.id });
            } catch (error) {
                this.log("Error approving proposal", error);
                throw error;
            }
        };

        const reject = async () => {
            try {
                await this.getClient().reject({
                    id: event.id,
                    reason: WC_ERRORS.USER_REJECTED,
                });
                this.log("Session proposal rejected", { id: event.id });
            } catch (error) {
                this.log("Error rejecting proposal", error);
                throw error;
            }
        };

        this.events.emit("sessionProposal", {
            proposal: event,
            approve,
            reject,
        });
    }

    private async onSessionRequest(event: SignClientTypes.EventArguments["session_request"]) {
        this.log("onSessionRequest()", { event });

        const { request } = event.params;
        const method = request.method;

        if (method === "cosmos_getAccounts") {
            await this.handleCosmosGetAccounts(event.topic, event.id);
        } else if (method === "cosmos_signDirect") {
            await this.handleCosmosSignDirect(event.topic, event.id, event.params);
        } else if (method === "cosmos_signAmino") {
            await this.handleCosmosSignAmino(event.topic, event.id, event.params);
        } else {
            this.log("Unsupported method", { method });
            await this.respondWithError(
                event.topic,
                event.id,
                WC_ERRORS.UNSUPPORTED_METHOD(method)
            );
        }
    }

    private onSessionDelete(event: SignClientTypes.EventArguments["session_delete"]) {
        this.log("onSessionDelete()", { event });
        this.events.emit("sessionDelete", event);
    }

    private onSessionExpire(event: SignClientTypes.EventArguments["session_expire"]) {
        this.log("onSessionExpire()", { event });
        this.events.emit("sessionExpire", event);
    }

    private async handleCosmosGetAccounts(topic: string, id: number) {
        if (!this.wallet) {
            await this.respondWithError(topic, id, WC_ERRORS.WALLET_NOT_INITIALIZED);
            return;
        }

        try {
            const pubkeyBase64 = Buffer.from(this.wallet.account.pubkey).toString("base64");
            const accounts = [
                {
                    algo: "secp256k1",
                    address: this.wallet.account.address,
                    pubkey: pubkeyBase64,
                },
            ];

            await this.respondWithResult(topic, id, accounts);
            this.log("cosmos_getAccounts responded", { topic, id, accounts });
        } catch (error) {
            this.log("Error getting accounts", error);
            await this.respondWithError(topic, id, WC_ERRORS.SIGNING_FAILED(error));
        }
    }

    private async handleCosmosSignDirect(
        topic: string,
        id: number,
        params: SignClientTypes.EventArguments["session_request"]["params"]
    ) {
        const { request } = params;
        const requestParams = request.params as { signerAddress?: string; signDoc?: any };
        const { signerAddress, signDoc } = requestParams;

        if (
            !this.checkForListeners(
                "cosmosSignDirect",
                topic,
                id,
                "No handler for cosmosSignDirect, rejecting request"
            )
        ) {
            return;
        }

        if (!signerAddress || !signDoc) {
            await this.respondWithError(topic, id, WC_ERRORS.INVALID_PARAMS("cosmos_signDirect"));
            return;
        }

        const approve = async () => {
            if (!this.wallet) {
                await this.respondWithError(topic, id, WC_ERRORS.WALLET_NOT_INITIALIZED);
                return;
            }
            try {
                const decodeBytes = (bytes: any): Uint8Array => {
                    if (bytes instanceof Uint8Array) {
                        return bytes;
                    }
                    if (Array.isArray(bytes)) {
                        return new Uint8Array(bytes);
                    }
                    if (typeof bytes === "string") {
                        return new Uint8Array(Buffer.from(bytes, "base64"));
                    }
                    throw new Error("Invalid bytes format");
                };

                const originalBodyBytes = decodeBytes(signDoc.bodyBytes);
                const originalAuthInfoBytes = decodeBytes(signDoc.authInfoBytes);

                const directSignDoc = {
                    bodyBytes: originalBodyBytes,
                    authInfoBytes: originalAuthInfoBytes,
                    chainId: signDoc.chainId,
                    accountNumber: BigInt(
                        typeof signDoc.accountNumber === "string"
                            ? signDoc.accountNumber
                            : signDoc.accountNumber.toString()
                    ),
                };

                const signed = await this.wallet.directWallet.signDirect(
                    signerAddress,
                    directSignDoc
                );

                const signedBodyBytes =
                    signed.signed.bodyBytes && signed.signed.bodyBytes.length > 0
                        ? signed.signed.bodyBytes
                        : originalBodyBytes;
                const signedAuthInfoBytes =
                    signed.signed.authInfoBytes && signed.signed.authInfoBytes.length > 0
                        ? signed.signed.authInfoBytes
                        : originalAuthInfoBytes;

                let signatureBytes: Uint8Array;
                const sig = signed.signature.signature;
                if (typeof sig === "string") {
                    signatureBytes = new Uint8Array(Buffer.from(sig, "base64"));
                } else if (sig && typeof sig === "object" && "length" in sig) {
                    signatureBytes = sig as Uint8Array;
                } else {
                    signatureBytes = new Uint8Array(sig as ArrayLike<number>);
                }

                const serializedSigned = {
                    signed: {
                        bodyBytes: Buffer.from(signedBodyBytes).toString("base64"),
                        authInfoBytes: Buffer.from(signedAuthInfoBytes).toString("base64"),
                        chainId: signed.signed.chainId || directSignDoc.chainId,
                        accountNumber: signed.signed.accountNumber
                            ? signed.signed.accountNumber.toString()
                            : directSignDoc.accountNumber.toString(),
                    },
                    signature: {
                        pub_key: signed.signature.pub_key,
                        signature: Buffer.from(signatureBytes).toString("base64"),
                    },
                };

                await this.respondWithResult(topic, id, serializedSigned);
                this.log("cosmos_signDirect approved", { topic, id });
            } catch (error) {
                this.log("Error signing direct", error);
                await this.respondWithError(topic, id, WC_ERRORS.SIGNING_FAILED(error));
            }
        };

        const reject = async () => {
            try {
                await this.respondWithError(topic, id, WC_ERRORS.USER_REJECTED);
                this.log("cosmos_signDirect rejected", { topic, id });
            } catch (error) {
                this.log("Error rejecting direct sign", error);
            }
        };

        this.events.emit("cosmosSignDirect", {
            topic,
            id,
            signerAddress,
            signDoc,
            approve,
            reject,
        });
    }

    private async handleCosmosSignAmino(
        topic: string,
        id: number,
        params: SignClientTypes.EventArguments["session_request"]["params"]
    ) {
        const { request } = params;
        const requestParams = request.params as { signerAddress?: string; signDoc?: any };
        const { signerAddress, signDoc } = requestParams;

        if (
            !this.checkForListeners(
                "cosmosSignAmino",
                topic,
                id,
                "No handler for cosmosSignAmino, rejecting request"
            )
        ) {
            return;
        }

        if (!signerAddress || !signDoc) {
            await this.respondWithError(topic, id, WC_ERRORS.INVALID_PARAMS("cosmos_signAmino"));
            return;
        }

        const approve = async () => {
            if (!this.wallet) {
                await this.respondWithError(topic, id, WC_ERRORS.WALLET_NOT_INITIALIZED);
                return;
            }
            try {
                const signed = await this.wallet.aminoWallet.signAmino(signerAddress, signDoc);
                await this.respondWithResult(topic, id, signed);
                this.log("cosmos_signAmino approved", { topic, id });
            } catch (error) {
                this.log("Error signing amino", error);
                await this.respondWithError(topic, id, WC_ERRORS.SIGNING_FAILED(error));
            }
        };

        const reject = async () => {
            try {
                await this.respondWithError(topic, id, WC_ERRORS.USER_REJECTED);
                this.log("cosmos_signAmino rejected", { topic, id });
            } catch (error) {
                this.log("Error rejecting amino sign", error);
            }
        };

        this.events.emit("cosmosSignAmino", {
            topic,
            id,
            signerAddress,
            signDoc,
            approve,
            reject,
        });
    }

    private async respondWithResult(topic: string, id: number, result: unknown) {
        await this.getClient().respond({
            topic,
            response: { id, jsonrpc: "2.0", result },
        });
    }

    private async respondWithError(topic: string, id: number, error: WalletConnectErrorResponse) {
        await this.getClient().respond({
            topic,
            response: { id, jsonrpc: "2.0", error },
        });
    }

    private async checkForListeners(
        event: keyof WCSEvents,
        topic: string,
        id: number,
        error: string
    ): Promise<boolean> {
        if (this.events.getEvent(event).getListenersCount() <= 0) {
            this.log(error, { topic, id });
            try {
                await this.respondWithError(topic, id, WC_ERRORS.NO_HANDLER);
            } catch (error) {
                this.log("Error rejecting request", error);
            }
            return false;
        }
        return true;
    }

    public getTopicFromUri(uri: string): string {
        return uri.split("@")[0]?.replace("wc:", "") || "";
    }

    private log(message: string, ...args: any[]) {
        console.log("🔵 [WalletConnectService]", message, ...args);
    }
}

export function createAdr36SignDoc(signer: string, data: string) {
    return makeSignDoc(
        [
            {
                type: "sign/MsgSignData",
                value: {
                    signer,
                    data: Buffer.from(data, "utf8").toString("base64"),
                },
            },
        ],
        { amount: [], gas: "0" },
        "",
        "",
        0,
        0
    );
}

export async function signAdr36Message(seedPhrase: string, signer: string, message: string) {
    const hdPath = stringToPath(GONKA_HD_PATH);
    const wallet = await Secp256k1HdWallet.fromMnemonic(seedPhrase, {
        prefix: GONKA_PREFIX,
        hdPaths: [hdPath],
    });

    const signDoc = createAdr36SignDoc(signer, message);
    const { signature, signed } = await wallet.signAmino(signer, signDoc);

    return {
        signed,
        signature,
    };
}

export function extractAdr36Message(signDoc: ReturnType<typeof makeSignDoc>): string | null {
    if (
        signDoc.msgs.length === 1 &&
        signDoc.msgs[0].type === "sign/MsgSignData" &&
        signDoc.chain_id === "" &&
        signDoc.memo === "" &&
        signDoc.account_number === "0" &&
        signDoc.sequence === "0" &&
        signDoc.fee.gas === "0" &&
        signDoc.fee.amount.length === 0
    ) {
        const msg = signDoc.msgs[0].value as { signer: string; data: string };
        return Buffer.from(msg.data, "base64").toString("utf8");
    }
    return null;
}
