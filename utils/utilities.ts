import { Connection, RpcResponseAndContext, SignatureStatus, TransactionConfirmationStatus } from "@solana/web3.js";
import { OptimizedRPC } from "./OptimizedRPC";
import { ConfirmationStatus } from "./Types";

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getSignatureStatusWithRetry({
    connection,
    signature,
    maxAttempts = 5,
    sleepDuration = 2000,
    commitment,
}: {
    connection: OptimizedRPC | Connection,
    signature: string,
    maxAttempts?: number,
    sleepDuration?: number
    commitment: TransactionConfirmationStatus;
}): Promise<RpcResponseAndContext<SignatureStatus | null>> {

    let attempts = 0;
    let sleepTime = 0;
    const maxDuration = 90 * 1000; //90 seconds

    let result: RpcResponseAndContext<(SignatureStatus | null)[]> = {
        context: { slot: 0 },
        value: [{
            slot: 0,
            confirmations: 0,
            err: null,
            confirmationStatus: undefined,
        }],
    };

    while (attempts < maxAttempts && sleepTime < maxDuration) {
        const startTime = performance.now();
        result = await connection.getSignatureStatuses([signature]);
        const responseTime = performance.now() - startTime;
        const confirmationStatusValue = ConfirmationStatus[result.value[0]?.confirmationStatus as keyof typeof ConfirmationStatus];
        if (result.value[0]?.confirmationStatus && confirmationStatusValue >= ConfirmationStatus[commitment]) {
            break;
        }
        attempts++;
        sleepTime += sleepDuration + responseTime;
        await sleep(sleepDuration);
    }

    return {
        context: result.context,
        value: result.value[0],
    };
}