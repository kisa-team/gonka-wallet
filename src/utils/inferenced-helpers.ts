import { join } from "node:path";
import { execCommand } from "@/src/utils/exec-command";
import { GonkaWallet } from "@/src/utils/wallet/GonkaWallet";

interface InferencedBalanceResponse {
    balances: Array<{
        denom: string;
        amount: string;
    }>;
}
export async function fetchBalanceViaInferenced(
    nodeUrl: string,
    address: string
): Promise<InferencedBalanceResponse> {
    if (!GonkaWallet.isValidGonkaAddress(address)) {
        throw new Error("Invalid address format");
    }

    if (!nodeUrl || typeof nodeUrl !== "string") {
        throw new Error("Invalid node URL");
    }

    const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+:\d+$/;
    if (!urlPattern.test(nodeUrl)) {
        throw new Error("Invalid node URL format");
    }

    const inferencedPath = join(process.cwd(), "inferenced");
    const args = ["query", "bank", "balances", address, "--node", nodeUrl, "--output", "json"];

    try {
        const { stdout, stderr } = await execCommand(inferencedPath, args, 15000);

        if (stderr && !stdout) {
            console.error(`inferenced stderr: ${stderr}`);
            throw new Error(`Command failed: ${stderr}`);
        }

        const data = JSON.parse(stdout);

        if (data.balances && Array.isArray(data.balances)) {
            return {
                balances: data.balances.map((b: any) => ({
                    denom: b.denom || "",
                    amount: b.amount || "0",
                })),
            };
        }

        throw new Error("Invalid response format from inferenced");
    } catch (error: any) {
        console.error(`Error executing inferenced:`, error);
        if (error.code === "ENOENT") {
            throw new Error("inferenced binary not found");
        }
        if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
            throw new Error("Command timed out");
        }
        throw error;
    }
}
