import { PublicClient, WalletClient, isAddressEqual } from "viem";
import { ContractClient, PingPongContract } from "./pingPong";
import { Hash, areEthereumHashesEqual } from "../../types/web3";
import { estimateFeesPerGas } from "viem/actions";
import { PingEvents } from "./ping";

export class Pong {
  constructor(_pingPongContract: PingPongContract) {
    this.contract = _pingPongContract;
  }

  fetchEvents = async (fromBlockNumber: bigint) => {
    return await this.contract.getEvents.Pong({
      fromBlock: fromBlockNumber,
    });
  };

  getMyDetails = async (
    pongEvents: PongEvents,
    { public: publicClient, wallet: pongerClient }: ContractClient
  ): Promise<PongDetails> => {
    const pongDetailsArray = await this.getAllDetails(pongEvents, publicClient);

    const pongerAddress = await this.getPongerAddress(pongerClient);

    const myPongDetails = pongDetailsArray.filter((pong) =>
      isAddressEqual(pong.from, pongerAddress)
    );

    return myPongDetails;
  };

  filterOutOthersPongEvents = (
    pongEvents: PongEvents,
    myPongDetails: PongDetails
  ): PongEvents => {
    const myPongEvents = pongEvents.filter((pongEvent) =>
      myPongDetails.some((myPongDetail) =>
        areEthereumHashesEqual(pongEvent.transactionHash, myPongDetail.hash)
      )
    );
    return myPongEvents;
  };

  pongUnpongedPings = async (
    unpongedPings: PingEvents,
    nonceOfLatestBlock: number,
    publicClient: PublicClient
  ) => {
    unpongedPings.forEach((unponged, i) => {
      this.executePong(
        unponged.transactionHash,
        publicClient,
        nonceOfLatestBlock,
        i,
        { retryExponent: 0, lowGasRetryCount: 0 }
      );
    });
  };

  private executePong = async (
    _pingTxHash: Hash,
    publicClient: PublicClient,
    nonceOfLatestPong: number,
    i: number,
    { retryExponent, lowGasRetryCount }: PongRetryParams
  ) => {
    try {
      const pongArgs = [_pingTxHash] as const;

      const txOptions = await this.getTransactionOptions(
        publicClient,
        nonceOfLatestPong,
        i,
        lowGasRetryCount
      );

      const pongTxHash = await this.contract.write.pong(pongArgs, txOptions);

      console.log("pongTxHash:", pongTxHash);
    } catch (e) {
      console.log("executePong-error:", e);

      const retryArgs: PongRetryParams = {
        retryExponent: retryExponent + 1,
        lowGasRetryCount,
      };

      this.handlePongError(
        e,
        _pingTxHash,
        publicClient,
        nonceOfLatestPong,
        i,
        retryArgs
      );
    }
  };

  private async getTransactionOptions(
    publicClient: PublicClient,
    nonceOfLatestPong: number,
    i: number,
    lowGasRetryCount: number
  ) {
    const adjustedFeeValues = await this.getAdjustedFeeValues(
      lowGasRetryCount,
      publicClient
    );

    return adjustedFeeValues
      ? {
          nonce: nonceOfLatestPong + i + 1,
          maxPriorityFeePerGas: adjustedFeeValues.maxPriorityFeePerGas,
          maxFeePerGas: adjustedFeeValues.maxFeePerGas,
        }
      : {
          nonce: nonceOfLatestPong + i + 1,
        };
  }

  private getAdjustedFeeValues = async (
    lowGasRetryCount: number,
    publicClient: PublicClient
  ) => {
    const feeValues = lowGasRetryCount
      ? await estimateFeesPerGas(publicClient)
      : undefined;

    let adjustedFeeValues;

    if (feeValues) {
      adjustedFeeValues = {
        maxFeePerGas: this.increaseByTenPercentPerRetry(
          feeValues.maxFeePerGas,
          lowGasRetryCount
        ),
        maxPriorityFeePerGas: this.increaseByTenPercentPerRetry(
          feeValues.maxPriorityFeePerGas,
          lowGasRetryCount
        ),
      };
    }

    return adjustedFeeValues;
  };

  // actually increases by a little more than 10%/retry
  private increaseByTenPercentPerRetry = (
    fee: bigint,
    lowGasRetryCount: number
  ) => {
    return BigInt(Math.floor(Number(fee) * (1 + lowGasRetryCount / 9.9)));
  };

  private handlePongError(
    error: unknown,
    pingTxHash: Hash,
    publicClient: PublicClient,
    nonceOfLatestBlock: number,
    index: number,
    { lowGasRetryCount, retryExponent }: PongRetryParams
  ): void {
    console.log("Error in executePong:", error);

    // * in rare cases, tx has been mined but is still being processed on a subsequent check that overlapped with the original mining.
    // * however, we will still not get duplicates as it is using the old, already mined nonce
    const isNonceTooLow = this.isNonceTooLowError(error);
    if (isNonceTooLow) return;

    const isLowGas = this.isLowGasError(error);
    const updatedLowGasRetryCount = isLowGas
      ? lowGasRetryCount + 1
      : lowGasRetryCount;

    const retryTime = this.calculateRetryTime(retryExponent);

    setTimeout(() => {
      this.executePong(pingTxHash, publicClient, nonceOfLatestBlock, index, {
        retryExponent: retryExponent + 1,
        lowGasRetryCount: updatedLowGasRetryCount,
      });
    }, retryTime);
  }

  private calculateRetryTime(retryExponent: number): number {
    //  retry with increasing intervals for failure
    // * https://docs.alchemy.com/reference/throughput#option-4-exponential-backoff
    const baseWaitTimeInMs = 2 ** retryExponent * 1000;
    return Math.min(baseWaitTimeInMs + getRandomMilliseconds(), MAX_BACKOFF);
  }

  getLatestPongedNonce(myPongDetails: PongDetails): number {
    let latestNonce = -1;

    myPongDetails.forEach((pong) => {
      if (
        pong.nonce &&
        typeof pong.nonce === "number" &&
        pong.nonce > latestNonce
      )
        latestNonce = pong.nonce;
    });

    return latestNonce;
  }

  private isNonceTooLowError = (error: unknown): boolean => {
    if (typeof error === "object" && error !== null && "details" in error) {
      const errorDetails = (error as { details: unknown }).details;
      return (
        typeof errorDetails === "string" &&
        errorDetails.startsWith(txDetail.nonceTooLow)
      );
    }
    return false;
  };

  private isLowGasError(error: unknown): boolean {
    if (typeof error === "object" && error !== null && "details" in error) {
      const errorDetails = (error as { details: unknown }).details;
      return (
        typeof errorDetails === "string" &&
        errorDetails === txDetail.replacementTxDetail
      );
    }
    return false;
  }

  private getAllDetails = async (
    pongEvents: PongEvents,
    publicClient: PublicClient
  ) => {
    return await Promise.all(
      pongEvents.map((pong) =>
        publicClient.getTransaction({ hash: pong.transactionHash })
      )
    );
  };

  private getPongerAddress = async (pongerClient: WalletClient) => {
    const [pongerAddress] = await pongerClient.getAddresses();

    if (!pongerAddress) throw `ponger wallet/address not setup correctly`;
    return pongerAddress;
  };

  contract: PingPongContract;
}

const txDetail = {
  replacementTxDetail: "replacement transaction underpriced",
  nonceTooLow: "nonce too low:",
} as const;

function getRandomMilliseconds(): number {
  return Math.floor(Math.random() * 1001);
}

const SIXTY_FOUR_SECONDS_IN_MS = 64_000;
const MAX_BACKOFF = SIXTY_FOUR_SECONDS_IN_MS;

export type PongEvents = Awaited<ReturnType<Pong["fetchEvents"]>>;
export type PongDetails = Awaited<ReturnType<Pong["getAllDetails"]>>;

interface PongRetryParams {
  retryExponent: number;
  lowGasRetryCount: number;
}
