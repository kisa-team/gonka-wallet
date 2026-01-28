"use client";
import { pubkeyToAddress } from "@cosmjs/amino";
import { fromBase64, toBase64 } from "@cosmjs/encoding";
import { encodePubkey, makeAuthInfoBytes, makeSignDoc } from "@cosmjs/proto-signing";
import { calculateFee } from "@cosmjs/stargate";
import { GenericAuthorization, Grant } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { MsgGrant } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Any } from "cosmjs-types/google/protobuf/any";
import { Timestamp } from "cosmjs-types/google/protobuf/timestamp";
import { useCallback, useState } from "react";
import { useErrorToast } from "@/src/utils/error-helpers";
import { getRPCClient, useWalletStore } from "./useWalletStore";

const SEND_TOKEN_MESSAGE_TYPE = "/cosmos.bank.v1beta1.MsgSend";

export type GrantSendTokenPermissionsStatus =
    | "idle"
    | "signing"
    | "broadcasting"
    | "pending"
    | "success"
    | "error";

export interface GrantSendTokenPermissionsResult {
    transactionHash: string | null;
    status: GrantSendTokenPermissionsStatus;
    error: string | null;
}

export const DEFAULT_GAS_LIMIT_GRANT_SEND = 200000;
export const DEFAULT_GAS_PRICE_GRANT_SEND = "0.1ngonka";

export interface GrantSendTokenPermissionsOptions {
    gasLimit?: number;
    gasPrice?: string;
    expirationDays?: number;
}

export const useGrantSendTokenPermissions = () => {
    const [status, setStatus] = useState<GrantSendTokenPermissionsStatus>("idle");
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const userWallet = useWalletStore((state) => state.userWallet);
    const showErrorToast = useErrorToast();

    const trackTransactionStatus = useCallback(async (txHash: string): Promise<void> => {
        const maxAttempts = 30;
        const delayMs = 2000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                await new Promise((resolve) => setTimeout(resolve, delayMs));

                const client = await getRPCClient();
                const tx = await client.getTx(txHash);

                if (!tx) {
                    if (attempt === maxAttempts - 1) {
                        throw new Error("Transaction status unknown after multiple attempts");
                    }
                    continue;
                }

                if (tx.code === 0) {
                    return;
                } else {
                    let errorMessage = "Unknown error";

                    if (tx.events && tx.events.length > 0) {
                        const errorEvents: string[] = [];

                        for (const event of tx.events) {
                            if (event.type === "message" && event.attributes) {
                                for (const attr of event.attributes) {
                                    if (attr.key === "error" || attr.key === "action") {
                                        const value = attr.value || "";
                                        if (value && !errorEvents.includes(value)) {
                                            errorEvents.push(value);
                                        }
                                    }
                                }
                            }
                        }

                        if (errorEvents.length > 0) {
                            errorMessage = errorEvents.join("; ");
                        } else {
                            errorMessage = `Transaction failed with code ${tx.code}`;
                        }
                    } else {
                        errorMessage = `Transaction failed with code ${tx.code}`;
                    }

                    throw new Error(errorMessage);
                }
            } catch (err) {
                if (err instanceof Error && err.message.includes("Transaction failed")) {
                    throw err;
                }
                if (attempt === maxAttempts - 1) {
                    throw new Error("Transaction status unknown after multiple attempts");
                }
            }
        }
    }, []);

    const grantPermissions = useCallback(
        async (
            granteeAddress: string,
            options?: GrantSendTokenPermissionsOptions
        ): Promise<GrantSendTokenPermissionsResult> => {
            if (!userWallet) {
                const errorMsg = "Wallet not initialized";
                setError(errorMsg);
                setStatus("error");
                showErrorToast(new Error(errorMsg));
                return { transactionHash: null, status: "error", error: errorMsg };
            }

            if (!granteeAddress || !granteeAddress.startsWith("gonka")) {
                const errorMsg = "Invalid grantee address";
                setError(errorMsg);
                setStatus("error");
                showErrorToast(new Error(errorMsg));
                return { transactionHash: null, status: "error", error: errorMsg };
            }

            setStatus("signing");
            setError(null);
            setTransactionHash(null);

            try {
                setStatus("broadcasting");

                const client = await getRPCClient();

                const account = await client.getAccount(userWallet.account.address);
                const chainId = await client.getChainId();

                if (!account) {
                    throw new Error("Account not found");
                }

                const accountNumber = account.accountNumber.toString();
                const sequence = account.sequence.toString();

                const gasLimit =
                    options?.gasLimit && options.gasLimit > 0
                        ? options.gasLimit
                        : DEFAULT_GAS_LIMIT_GRANT_SEND;
                const gasPrice =
                    options?.gasPrice && options.gasPrice.trim() !== ""
                        ? options.gasPrice
                        : DEFAULT_GAS_PRICE_GRANT_SEND;

                const fee = calculateFee(gasLimit, gasPrice);

                const expirationDays = options?.expirationDays ?? 365;
                const expirationTime = new Date();
                expirationTime.setDate(expirationTime.getDate() + expirationDays);
                const expirationSeconds = Math.floor(expirationTime.getTime() / 1000);
                const expirationNanos = (expirationTime.getTime() % 1000) * 1_000_000;

                const genericAuth = GenericAuthorization.fromPartial({
                    msg: SEND_TOKEN_MESSAGE_TYPE,
                });

                const authAny = Any.fromPartial({
                    typeUrl: "/cosmos.authz.v1beta1.GenericAuthorization",
                    value: GenericAuthorization.encode(genericAuth).finish(),
                });

                const expiration = Timestamp.fromPartial({
                    seconds: BigInt(expirationSeconds),
                    nanos: expirationNanos,
                });

                const grant = Grant.fromPartial({
                    authorization: authAny,
                    expiration: expiration,
                });

                const msgGrantValue = MsgGrant.fromPartial({
                    granter: userWallet.account.address,
                    grantee: granteeAddress,
                    grant: grant,
                });

                const encodedMsg = MsgGrant.encode(msgGrantValue).finish();
                const msgAny = Any.fromPartial({
                    typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
                    value: encodedMsg,
                });

                const txBody = TxBody.fromPartial({
                    messages: [msgAny],
                    memo: "",
                });

                const bodyWriter = TxBody.encode(txBody);
                const bodyBytes = bodyWriter.finish();
                const pubkeyBytes = userWallet.account.pubkey;

                const pubkey = encodePubkey({
                    type: "tendermint/PubKeySecp256k1",
                    value: toBase64(pubkeyBytes),
                });

                const derivedAddress = pubkeyToAddress(
                    {
                        type: "tendermint/PubKeySecp256k1",
                        value: toBase64(pubkeyBytes),
                    },
                    "gonka"
                );

                if (userWallet.account.address !== derivedAddress) {
                    throw new Error(
                        `Pubkey does not match address. Expected: ${userWallet.account.address}, Derived: ${derivedAddress}`
                    );
                }

                const sequenceNumber = BigInt(Number.parseInt(sequence, 10));

                const authInfoBytes = makeAuthInfoBytes(
                    [{ pubkey, sequence: sequenceNumber }],
                    fee.amount,
                    Number.parseInt(fee.gas, 10),
                    fee.granter,
                    fee.payer
                );

                const accountNumberNum = Number.parseInt(accountNumber, 10);
                const signDoc = makeSignDoc(bodyBytes, authInfoBytes, chainId, accountNumberNum);

                const signResponse = await userWallet.directWallet.signDirect(
                    userWallet.account.address,
                    signDoc
                );

                const signatureBytes = fromBase64(signResponse.signature.signature);

                const txRaw = TxRaw.fromPartial({
                    bodyBytes,
                    authInfoBytes,
                    signatures: [signatureBytes],
                });

                const writer = TxRaw.encode(txRaw);
                const signedTxBytes = writer.finish();

                const result = await client.broadcastTx(signedTxBytes);

                if (result.code !== 0) {
                    let errorMessage = "Unknown error";

                    if (result.events && result.events.length > 0) {
                        const errorEvents: string[] = [];

                        for (const event of result.events) {
                            if (event.type === "message" && event.attributes) {
                                for (const attr of event.attributes) {
                                    if (attr.key === "error" || attr.key === "action") {
                                        const value = attr.value || "";
                                        if (value && !errorEvents.includes(value)) {
                                            errorEvents.push(value);
                                        }
                                    }
                                }
                            }
                        }

                        if (errorEvents.length > 0) {
                            errorMessage = errorEvents.join("; ");
                        } else {
                            errorMessage = `Transaction failed with code ${result.code}`;
                        }
                    } else {
                        errorMessage = `Transaction failed with code ${result.code}`;
                    }

                    throw new Error(errorMessage);
                }

                const txHash = result.transactionHash;
                setTransactionHash(txHash);
                setStatus("pending");

                await trackTransactionStatus(txHash);

                setStatus("success");
                return {
                    transactionHash: txHash,
                    status: "success",
                    error: null,
                };
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                setError(errorMsg);
                setStatus("error");
                showErrorToast(err instanceof Error ? err : new Error(errorMsg));
                return { transactionHash: null, status: "error", error: errorMsg };
            }
        },
        [userWallet, showErrorToast, trackTransactionStatus]
    );

    const reset = useCallback(() => {
        setStatus("idle");
        setTransactionHash(null);
        setError(null);
    }, []);

    return {
        grantPermissions,
        status,
        transactionHash,
        error,
        reset,
    };
};
