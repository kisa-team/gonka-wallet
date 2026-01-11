"use client";
import { pubkeyToAddress } from "@cosmjs/amino";
import { fromBase64, toBase64 } from "@cosmjs/encoding";
import { encodePubkey, makeAuthInfoBytes, makeSignDoc, Registry } from "@cosmjs/proto-signing";
import { calculateFee, coins, defaultRegistryTypes } from "@cosmjs/stargate";
import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Any } from "cosmjs-types/google/protobuf/any";
import { useCallback, useState } from "react";
import { useErrorToast } from "@/src/utils/error-helpers";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";
import { getRPCClient, useWalletStore } from "./useWalletStore";

export type DelegateStatus = "idle" | "signing" | "broadcasting" | "pending" | "success" | "error";

export interface DelegateResult {
    transactionHash: string | null;
    status: DelegateStatus;
    error: string | null;
}

export interface DelegateOptions {
    gasLimit?: number;
    gasPrice?: string;
    memo?: string;
}

const DEFAULT_GAS_LIMIT = 200000;
const DEFAULT_GAS_PRICE = "0.1ngonka";

export const useDelegate = () => {
    const [status, setStatus] = useState<DelegateStatus>("idle");
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
            } catch (e) {
                if (attempt === maxAttempts - 1) {
                    throw e;
                }
            }
        }
    }, []);

    const delegate = useCallback(
        async (
            validatorAddress: string,
            amountGNK: number,
            options?: DelegateOptions
        ): Promise<DelegateResult> => {
            if (!userWallet) {
                const errorMsg = "Wallet not connected";
                setError(errorMsg);
                setStatus("error");
                showErrorToast(errorMsg);
                return { transactionHash: null, status: "error", error: errorMsg };
            }

            setStatus("idle");
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
                        : DEFAULT_GAS_LIMIT;
                const gasPrice =
                    options?.gasPrice && options.gasPrice.trim() !== ""
                        ? options.gasPrice
                        : DEFAULT_GAS_PRICE;

                const amount = coins(Math.floor(amountGNK * GonkaWallet.NGONKA_TO_GONKA), "ngonka");
                const fee = calculateFee(gasLimit, gasPrice);

                const registry = new Registry(defaultRegistryTypes);

                const msgDelegate = {
                    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
                    value: {
                        delegatorAddress: userWallet.account.address,
                        validatorAddress: validatorAddress,
                        amount: amount[0],
                    },
                };

                const encodedMsg = registry.encode(msgDelegate);
                const msgAny = Any.fromPartial({
                    typeUrl: msgDelegate.typeUrl,
                    value: encodedMsg,
                });

                const memo = options?.memo ?? "";

                const txBody = TxBody.fromPartial({
                    messages: [msgAny],
                    memo,
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

                setStatus("signing");

                const signResponse = await userWallet.directWallet.signDirect(
                    userWallet.account.address,
                    signDoc
                );

                const signatureBytes = fromBase64(signResponse.signature.signature);

                const txRaw = TxRaw.fromPartial({
                    bodyBytes: signResponse.signed.bodyBytes,
                    authInfoBytes: signResponse.signed.authInfoBytes,
                    signatures: [signatureBytes],
                });

                const writer = TxRaw.encode(txRaw);
                const signedTxBytes = writer.finish();

                const result = await client.broadcastTx(signedTxBytes);

                if (result.code !== 0) {
                    let errorMessage = "Unknown error";

                    if (result.rawLog) {
                        try {
                            const logs = JSON.parse(result.rawLog);
                            if (Array.isArray(logs) && logs.length > 0) {
                                const messages: string[] = [];
                                for (const log of logs) {
                                    if (log.message) {
                                        messages.push(log.message);
                                    }
                                }
                                if (messages.length > 0) {
                                    errorMessage = messages.join("; ");
                                }
                            }
                        } catch {
                            errorMessage = result.rawLog;
                        }
                    }

                    throw new Error(errorMessage);
                }

                setTransactionHash(result.transactionHash);
                setStatus("pending");

                await trackTransactionStatus(result.transactionHash);

                setStatus("success");
                return {
                    transactionHash: result.transactionHash,
                    status: "success",
                    error: null,
                };
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                setError(errorMessage);
                setStatus("error");
                showErrorToast(errorMessage);
                return {
                    transactionHash: null,
                    status: "error",
                    error: errorMessage,
                };
            }
        },
        [userWallet, showErrorToast, trackTransactionStatus]
    );

    const reset = useCallback(() => {
        setStatus("idle");
        setError(null);
        setTransactionHash(null);
    }, []);

    return {
        delegate,
        status,
        transactionHash,
        error,
        reset,
    };
};
