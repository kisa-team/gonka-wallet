import { makeSignDoc, Secp256k1HdWallet } from "@cosmjs/amino";
import { stringToPath } from "@cosmjs/crypto";

const GONKA_HD_PATH = "m/44'/1200'/0'/0/0";
const GONKA_PREFIX = "gonka";

export interface Adr36SignResult {
    address: string;
    pubkey: string;
    signature: string;
    signDoc: ReturnType<typeof makeSignDoc>;
}

function createAdr36SignDoc(signer: string, data: string) {
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

export async function signGonkaVerificationMessage(
    seedPhrase: string,
    message: string
): Promise<Adr36SignResult> {
    const hdPath = stringToPath(GONKA_HD_PATH);
    const wallet = await Secp256k1HdWallet.fromMnemonic(seedPhrase, {
        prefix: GONKA_PREFIX,
        hdPaths: [hdPath],
    });

    const [account] = await wallet.getAccounts();
    const signDoc = createAdr36SignDoc(account.address, message);
    const { signature, signed } = await wallet.signAmino(account.address, signDoc);

    return {
        address: account.address,
        pubkey: Buffer.from(account.pubkey).toString("base64"),
        signature: signature.signature,
        signDoc: signed,
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
