import { CosmosWallet } from "@/src/utils/wallet/CosmosWallet";

export class GonkaWallet extends CosmosWallet {
    protected chainPrefix: string = "gonka";
    protected coinType: number = 1200;
    public static NGONKA_TO_GONKA = 1_000_000_000;

    public static isValidGonkaAddress(address: string): boolean {
        return CosmosWallet.isValidBech32Address(address, "gonka");
    }
}
