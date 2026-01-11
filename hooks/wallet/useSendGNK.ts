"use client";
import { pubkeyToAddress } from "@cosmjs/amino";
import { fromBase64, toBase64 } from "@cosmjs/encoding";
import {
    decodeTxRaw,
    encodePubkey,
    makeAuthInfoBytes,
    makeSignDoc,
    Registry,
} from "@cosmjs/proto-signing";
import { calculateFee, coins, defaultRegistryTypes } from "@cosmjs/stargate";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";
import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Any } from "cosmjs-types/google/protobuf/any";
import { useCallback, useState } from "react";
import { useErrorToast } from "@/src/utils/error-helpers";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";
import { getRPCClient, useWalletStore } from "./useWalletStore";

export type TransactionStatus =
    | "idle"
    | "signing"
    | "broadcasting"
    | "pending"
    | "success"
    | "error";

export interface SendGNKResult {
    transactionHash: string | null;
    status: TransactionStatus;
    error: string | null;
}

export const DEFAULT_GAS_LIMIT = 200000;
export const DEFAULT_GAS_PRICE = "0.1ngonka";
export const DEFAULT_FEE_NGONKA = DEFAULT_GAS_LIMIT * 0.1;
export const DEFAULT_FEE_GNK = DEFAULT_FEE_NGONKA / GonkaWallet.NGONKA_TO_GONKA;

export interface SendGNKOptions {
    gasLimit?: number;
    gasPrice?: string;
    memo?: string;
}

export const useSendGNK = () => {
    const [status, setStatus] = useState<TransactionStatus>("idle");
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

    const sendGNK = useCallback(
        async (
            recipientAddress: string,
            amountGNK: number,
            options?: SendGNKOptions
        ): Promise<SendGNKResult> => {
            if (!userWallet) {
                const errorMsg = "Wallet not initialized";
                setError(errorMsg);
                setStatus("error");
                showErrorToast(new Error(errorMsg));
                return { transactionHash: null, status: "error", error: errorMsg };
            }

            if (!recipientAddress || !recipientAddress.startsWith("gonka")) {
                const errorMsg = "Invalid recipient address";
                setError(errorMsg);
                setStatus("error");
                showErrorToast(new Error(errorMsg));
                return { transactionHash: null, status: "error", error: errorMsg };
            }

            if (amountGNK <= 0) {
                const errorMsg = "Amount must be greater than 0";
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
                        : DEFAULT_GAS_LIMIT;
                const gasPrice =
                    options?.gasPrice && options.gasPrice.trim() !== ""
                        ? options.gasPrice
                        : DEFAULT_GAS_PRICE;

                const amount = coins(Math.floor(amountGNK * GonkaWallet.NGONKA_TO_GONKA), "ngonka");
                const fee = calculateFee(gasLimit, gasPrice);

                const registry = new Registry(defaultRegistryTypes);

                const msgSend = {
                    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
                    value: {
                        fromAddress: userWallet.account.address,
                        toAddress: recipientAddress,
                        amount: amount,
                    },
                };

                const encodedMsg = registry.encode(msgSend);
                const msgAny = Any.fromPartial({
                    typeUrl: msgSend.typeUrl,
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

                try {
                    const decoded = decodeTxRaw(signedTxBytes);

                    if (!decoded.body?.messages || decoded.body.messages.length !== 1) {
                        throw new Error("Only single MsgSend supported");
                    }

                    if (
                        !decoded.authInfo?.signerInfos ||
                        decoded.authInfo.signerInfos.length !== 1
                    ) {
                        throw new Error("Exactly one signer required");
                    }

                    if (!decoded.signatures || decoded.signatures.length !== 1) {
                        throw new Error("Exactly one signature required");
                    }

                    const signerInfo = decoded.authInfo.signerInfos[0];

                    if (
                        !signerInfo.publicKey ||
                        signerInfo.publicKey.typeUrl !== "/cosmos.crypto.secp256k1.PubKey"
                    ) {
                        throw new Error("Unsupported pubkey type");
                    }

                    const decodedPubkey = PubKey.decode(signerInfo.publicKey.value);
                    const signerAddress = pubkeyToAddress(
                        {
                            type: "tendermint/PubKeySecp256k1",
                            value: toBase64(decodedPubkey.key),
                        },
                        "gonka"
                    );

                    const msgAny = decoded.body.messages[0];
                    if (msgAny.typeUrl !== "/cosmos.bank.v1beta1.MsgSend") {
                        throw new Error("Unsupported message type");
                    }

                    const msgSend = MsgSend.decode(msgAny.value);

                    if (!msgSend.fromAddress || !msgSend.toAddress) {
                        throw new Error("Invalid addresses");
                    }

                    if (
                        !msgSend.fromAddress.startsWith("gonka") ||
                        !msgSend.toAddress.startsWith("gonka")
                    ) {
                        throw new Error("Invalid address prefix");
                    }

                    if (msgSend.fromAddress !== signerAddress) {
                        throw new Error("Signer does not match fromAddress");
                    }

                    if (!msgSend.amount || msgSend.amount.length !== 1) {
                        throw new Error("Amount is required");
                    }

                    const coin = msgSend.amount[0];
                    const amountBigInt = BigInt(coin.amount || "0");
                    if (!coin.denom || coin.denom !== "ngonka" || amountBigInt <= BigInt(0)) {
                        throw new Error("Invalid amount");
                    }

                    const gasLimitRaw = decoded.authInfo.fee?.gasLimit ?? 0;
                    const gasLimitBigInt = BigInt(gasLimitRaw.toString());
                    const MAX_GAS = BigInt("500000");
                    if (gasLimitBigInt <= BigInt(0) || gasLimitBigInt > MAX_GAS) {
                        throw new Error("Invalid gas limit");
                    }

                    const feeAmount = decoded.authInfo.fee?.amount?.[0];
                    const maxFee = BigInt(GonkaWallet.NGONKA_TO_GONKA);
                    if (
                        !feeAmount ||
                        feeAmount.denom !== "ngonka" ||
                        BigInt(feeAmount.amount || "0") < BigInt(0) ||
                        BigInt(feeAmount.amount || "0") > maxFee
                    ) {
                        throw new Error("Invalid fee");
                    }
                } catch (validationError) {
                    const message =
                        validationError instanceof Error
                            ? validationError.message
                            : "Tx validation failed";
                    throw new Error(`Transaction validation failed: ${message}`);
                }

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
        sendGNK,
        status,
        transactionHash,
        error,
        reset,
    };
};
