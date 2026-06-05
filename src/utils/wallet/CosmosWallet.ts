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

export class CosmosWallet {
    protected seedPhrase?: string;
    protected chainPrefix: string = "cosmos";
    protected coinType: number = 118;
    protected account?: AccountData;
    protected pubkeyHex?: string;
    protected hdPath?: HdPath;
    protected aminoWallet?: Secp256k1HdWallet;
    protected directWallet?: DirectSecp256k1HdWallet;
    protected privateKey?: string;

    public async initialize(seedPhrase: string): Promise<this> {
        if (!bip39.validateMnemonic(seedPhrase)) {
            throw new Error("Invalid seed phrase");
        }
        this.seedPhrase = seedPhrase;

        const hdPath = stringToPath(`m/44'/${this.coinType}'/0'/0/0`);
        const options = {
            prefix: this.chainPrefix,
            hdPaths: [hdPath],
        };
        const aminoWallet = await Secp256k1HdWallet.fromMnemonic(this.seedPhrase, options);
        const directWallet = await DirectSecp256k1HdWallet.fromMnemonic(this.seedPhrase, options);
        const [directAccount] = await directWallet.getAccounts();

        this.account = directAccount;
        this.pubkeyHex = Buffer.from(directAccount.pubkey).toString("hex");
        this.hdPath = hdPath;
        this.aminoWallet = aminoWallet;
        this.directWallet = directWallet;
        this.privateKey = await this.extractPrivateKey();

        return this;
    }

    public getSeedPhrase(): string {
        if (!this.seedPhrase) {
            this.throwError();
        }
        return this.seedPhrase;
    }

    public getAccount(): AccountData {
        if (!this.account) {
            this.throwError();
        }
        return this.account;
    }

    public getPubkeyHex(): string {
        if (!this.pubkeyHex) {
            this.throwError();
        }
        return this.pubkeyHex;
    }

    public getHdPath(): HdPath {
        if (!this.hdPath) {
            this.throwError();
        }
        return this.hdPath;
    }

    public getAminoWallet(): Secp256k1HdWallet {
        if (!this.aminoWallet) {
            this.throwError();
        }
        return this.aminoWallet;
    }

    public getDirectWallet(): DirectSecp256k1HdWallet {
        if (!this.directWallet) {
            this.throwError();
        }
        return this.directWallet;
    }

    public getPrivateKey(): string {
        if (!this.privateKey) {
            this.throwError();
        }
        return this.privateKey;
    }

    private async extractPrivateKey(): Promise<string> {
        if (!this.seedPhrase) {
            this.throwError();
        }

        const mnemonic = new EnglishMnemonic(this.seedPhrase);
        const seed = await Bip39.mnemonicToSeed(mnemonic);
        const hdPath = stringToPath(`m/44'/${this.coinType}'/0'/0/0`);
        const result = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
        return Buffer.from(result.privkey).toString("hex");
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

    private throwError(): never {
        throw new Error("First initialize the wallet");
    }

    public static generateSeedPhrase(): string {
        return bip39.generateMnemonic(256);
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
}
