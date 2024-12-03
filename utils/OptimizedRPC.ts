import {
    AccountInfo,
    AddressLookupTableAccount,
    Commitment,
    ConfirmedSignatureInfo,
    Connection,
    Finality,
    GetAccountInfoConfig,
    GetBalanceConfig,
    GetLatestBlockhashConfig,
    GetProgramAccountsConfig,
    GetTransactionConfig,
    PublicKey,
    RpcResponseAndContext,
    SendOptions,
    SignaturesForAddressOptions,
    TokenAccountsFilter,
    VersionedTransactionResponse,
    ParsedAccountData,
    GetSlotConfig,
    GetMultipleAccountsConfig,
    VersionedTransaction,
    Transaction,
    SimulateTransactionConfig,
    SimulatedTransactionResponse,
    Signer,
    Message,
    SignatureStatus,
    SignatureStatusConfig,
} from '@solana/web3.js';
import clone from 'lodash/clone';
import chunk from 'lodash/chunk';

import {
    GET_ACCOUNT_BATCH_SIZE,
    RPC_BATCH_COLLECTION_PERIOD,
} from './Constants';
import { sleep } from './utilities';

export type AccountData = null | AccountInfo<Buffer>;
export type AccountInfoCallback = (result: AccountData) => void;

export interface Request {
    callback: AccountInfoCallback;

    payload: PublicKey;
}

export class OptimizedRPC {
    private queuedRequests: Request[] = [];

    private running: boolean = false;

    constructor(private connection: Connection) {
    }

    public async init() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.rpcLoop();
    }

    public async stop() {
        this.running = false;
    }

    public getTransaction(signature: string, rawConfig?: GetTransactionConfig): Promise<null | VersionedTransactionResponse> {
        return this.connection.getTransaction(
            signature,
            rawConfig || {
                maxSupportedTransactionVersion: 0,
            },
        );
    }

    public getSignaturesForAddress(address: PublicKey, options?: SignaturesForAddressOptions, commitment?: Finality): Promise<ConfirmedSignatureInfo[]> {
        return this.connection.getSignaturesForAddress(address, options, commitment);
    }

    public getAccountInfo(account: PublicKey): Promise<AccountData> {
        return new Promise<AccountData>((res) => {
            this.queuedRequests.push({
                callback: res,
                payload: account,
            });
        });
    }

    public async getAddressLookupTable(
        accountKey: PublicKey,
        config?: GetAccountInfoConfig,
    ): Promise<RpcResponseAndContext<null | AddressLookupTableAccount> | undefined> {
        let attempts = 0;

        while (true) {
            try {
                return this.connection.getAddressLookupTable(
                    accountKey,
                    config,
                );
            } catch (err) {
                attempts++;

                console.log(`Error getting address lookup table info: ${err}`);

                if (attempts >= 3) {
                    return undefined;
                }

                await sleep(2000);
            }
        }
    }

    public async getBalanceAndContext(publicKey: PublicKey, commitmentOrConfig?: Commitment | GetBalanceConfig): Promise<RpcResponseAndContext<number>> {
        return this.connection.getBalanceAndContext(publicKey, commitmentOrConfig);
    }

    public async getTokenAccountBalance(tokenAddress: PublicKey, commitment?: Commitment) {
        return this.connection.getTokenAccountBalance(tokenAddress, commitment);
    }

    public getMultipleAccountsInfo(publicKeys: PublicKey[], commitmentOrConfig?: Commitment | GetMultipleAccountsConfig) {
        return this.connection.getMultipleAccountsInfo(publicKeys, commitmentOrConfig);
    }

    public async getParsedTokenAccountsByOwner(
        ownerAddress: PublicKey,
        filter: TokenAccountsFilter,
        commitment?: Commitment,
    ): Promise<RpcResponseAndContext<{
        account: AccountInfo<ParsedAccountData>;
        pubkey: PublicKey;
    }[]>> {
        return this.connection.getParsedTokenAccountsByOwner(
            ownerAddress,
            filter,
            commitment,
        );
    }

    public async getLatestBlockhash(commitmentOrConfig?: Commitment | GetLatestBlockhashConfig): Promise<{ blockhash: string, lastValidBlockHeight: number }> {
        return this.connection.getLatestBlockhash(commitmentOrConfig);
    }

    public getConnection(): Connection {
        return this.connection;
    }

    public sendRawTransaction(rawTransaction: Uint8Array | Buffer | number[], options?: SendOptions): Promise<string> {
        return this.connection.sendRawTransaction(rawTransaction, options);
    }

    public getSignatureStatuses(strategy: string[], config?: SignatureStatusConfig): Promise<RpcResponseAndContext<(SignatureStatus | null)[]>> {
        return this.connection.getSignatureStatuses(strategy, config);
    }

    public getSlot(commitmentOrConfig?: Commitment | GetSlotConfig): Promise<number> {
        return this.connection.getSlot(commitmentOrConfig);
    }

    public simulateTransaction(
        transactionOrMessage: VersionedTransaction | Transaction | Message,
        configOrSigners?: SimulateTransactionConfig | Array<Signer>,
        includeAccounts?: boolean | Array<PublicKey>,
    ): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
        return (this.connection as any).simulateTransaction(transactionOrMessage, configOrSigners, includeAccounts);
    }

    private async rpcLoop() {
        while (this.running) {
            await sleep(RPC_BATCH_COLLECTION_PERIOD);

            const requestsToProcess = clone(this.queuedRequests);

            this.queuedRequests = [];

            const chunks = chunk(requestsToProcess, GET_ACCOUNT_BATCH_SIZE);

            for (const chunk of chunks) {
                const publicKeys = [];

                for (const request of chunk) {
                    publicKeys.push(request.payload);
                }

                const result = await this.connection.getMultipleAccountsInfo(publicKeys);

                let i = 0;

                for (const request of chunk) {
                    const response = result ? result[i] : null;
                    request.callback(response);
                    i++;
                }
            }
        }
    }
}