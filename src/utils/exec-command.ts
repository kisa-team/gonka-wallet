import { spawn } from "node:child_process";

export function execCommand(
    command: string,
    args: string[],
    timeout: number = 15000
): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, args, {
            timeout,
        });

        let stdout = "";
        let stderr = "";
        let timeoutId: NodeJS.Timeout | null = null;

        if (timeout > 0) {
            timeoutId = setTimeout(() => {
                childProcess.kill();
                reject(new Error("Command timed out"));
            }, timeout);
        }

        childProcess.stdout.on("data", (data: Buffer) => {
            stdout += data.toString();
        });

        childProcess.stderr.on("data", (data: Buffer) => {
            stderr += data.toString();
        });

        childProcess.on("close", (code: number | null) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (code !== 0 && !stdout) {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            } else {
                resolve({ stdout, stderr });
            }
        });

        childProcess.on("error", (error: Error) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            reject(error);
        });
    });
}
