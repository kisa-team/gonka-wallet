import { Secp256k1HdWallet } from "@cosmjs/amino";
import {
    Bip39,
    EnglishMnemonic,
    type HdPath,
    Slip10,
    Slip10Curve,
    stringToPath,
} from "@cosmjs/crypto";
import { type AccountData, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import * as bip39 from "bip39";

export interface UserWallet {
    account: AccountData;
    pubkeyHex: string;
    hdPath: HdPath;
    aminoWallet: Secp256k1HdWallet;
    directWallet: DirectSecp256k1HdWallet;
}

export class CosmosWallet {
    protected masterMnemonic?: string;
    protected chainPrefix: string = "cosmos";
    protected coinType: number = 118;

    public generateMasterSeed(): string {
        this.masterMnemonic = bip39.generateMnemonic(256);
        return this.masterMnemonic;
    }

    public setMasterSeed(mnemonic: string) {
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error("Invalid master seed phrase");
        }
        this.masterMnemonic = mnemonic;
    }

    public async createWallet(): Promise<UserWallet> {
        if (!this.masterMnemonic) {
            throw new Error("First set the master seed phrase");
        }

        const hdPath = stringToPath(`m/44'/${this.coinType}'/0'/0/0`);
        const options = {
            prefix: this.chainPrefix,
            hdPaths: [hdPath],
        };
        const aminoWallet = await Secp256k1HdWallet.fromMnemonic(this.masterMnemonic, options);
        const directWallet = await DirectSecp256k1HdWallet.fromMnemonic(
            this.masterMnemonic,
            options
        );
        const [directAccount] = await directWallet.getAccounts();

        return {
            account: directAccount,
            pubkeyHex: Buffer.from(directAccount.pubkey).toString("hex"),
            hdPath,
            aminoWallet,
            directWallet,
        };
    }

    public async getPrivateKey(): Promise<string> {
        if (!this.masterMnemonic) {
            throw new Error("First set the master seed phrase");
        }

        const mnemonic = new EnglishMnemonic(this.masterMnemonic);
        const seed = await Bip39.mnemonicToSeed(mnemonic);
        const hdPath = stringToPath(`m/44'/${this.coinType}'/0'/0/0`);
        const result = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
        return Buffer.from(result.privkey).toString("hex");
    }

    public static isValidBech32Address(
        address: string,
        prefix: string,
        minDataLength: number = 38,
        maxDataLength: number = 58,
        minTotalLength: number = 20,
        maxTotalLength: number = 50
    ): boolean {
        if (!address || typeof address !== "string") {
            return false;
        }

        if (address.length < minTotalLength || address.length > maxTotalLength) {
            return false;
        }

        if (!address.startsWith(prefix)) {
            return false;
        }

        const bech32Pattern = new RegExp(`^${prefix}1[a-z0-9]{${minDataLength},${maxDataLength}}$`);
        if (!bech32Pattern.test(address)) {
            return false;
        }

        const dangerousChars = /[;&|`$(){}[\]<>'"\\\n\r\t]/;
        if (dangerousChars.test(address)) {
            return false;
        }

        return true;
    }

    public isValidBech32Address(
        address: string,
        minDataLength: number = 38,
        maxDataLength: number = 58,
        minTotalLength: number = 20,
        maxTotalLength: number = 50
    ): boolean {
        return CosmosWallet.isValidBech32Address(
            address,
            this.chainPrefix,
            minDataLength,
            maxDataLength,
            minTotalLength,
            maxTotalLength
        );
    }
}
