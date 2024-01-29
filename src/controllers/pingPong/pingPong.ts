import { PublicClient, WalletClient, getContract } from "viem";
import { PINGPONG_ABI } from "../../artifacts/pingPongAbi";
import { getPongerClient, getPublicClient } from "../../config/ethClients";
import { areEthereumHashesEqual } from "../../types/web3";
import { Ping, PingEvents } from "./ping";
import { Pong, PongDetails, PongEvents } from "./pong";
import { getBlockNumber } from "viem/actions";
import { PingPongEnv } from "../../config/types";

export class PingPong {
  constructor(
    ALCHEMY_KEY: string,
    {
      PINGPONG_ADDRESS,
      PINGPONG_STARTING_BLOCK,
      PONGER_KEY,
      GOERLI_OR_SEPOLIA,
    }: PingPongEnv
  ) {
    console.log("constructing PingPong");

    const publicClient = getPublicClient(ALCHEMY_KEY, GOERLI_OR_SEPOLIA);
    const pongerClient = getPongerClient(
      PONGER_KEY,
      ALCHEMY_KEY,
      GOERLI_OR_SEPOLIA
    );

    const contractClient = {
      public: publicClient,
      wallet: pongerClient,
      pollingInterval: 5_000,
    } as const;

    this.contract = getContract({
      address: PINGPONG_ADDRESS,
      abi: PINGPONG_ABI,
      client: contractClient,
    });

    this.ping = new Ping(this.contract);
    this.pong = new Pong(this.contract);

    this.startingBlock = BigInt(PINGPONG_STARTING_BLOCK);
    this.processPendingPings(contractClient).then((initBlockNumber) => {
      this.handlePingEvents(contractClient, initBlockNumber);
    });
  }

  contract;
  ping: Ping;
  pong: Pong;
  startingBlock: bigint;

  private handlePingEvents = async (
    contractClient: ContractClient,
    initBlockNumber: bigint | undefined
  ) => {
    console.log("listening for pings");
    contractClient.public.watchBlockNumber({
      onBlockNumber: async (_blockNumber) => {
        if (_blockNumber) {
          // * slight delay after init to make sure init blocks go through. Delay is at least two blocks but may be upto 5 blocks the very first time.
          // * if initBlockNumber === undefined, probably means a network error during initialization. Start listening so when network resumes, you can catch up
          if (
            initBlockNumber === undefined ||
            _blockNumber > initBlockNumber + 1n
          ) {
            // * two block delay after each time after that.
            if (Number(_blockNumber) % 3 === 0) {
              this.processPendingPings(contractClient);
            }
          }
        }
      },
    });
  };

  private processPendingPings = async (contractClient: ContractClient) => {
    const pingPongEventsObj = await this.fetchPingPongEvents(
      this.startingBlock
    );

    if (!pingPongEventsObj) return;

    const myPongDetails = await this.pong.getMyDetails(
      pingPongEventsObj.pongEvents,
      contractClient
    );

    const unpongedPings = await this.getUnpongedPings(
      pingPongEventsObj,
      myPongDetails
    );

    //sort pings by ascending order
    unpongedPings.sort((a, b) => {
      return Number(a.blockNumber - b.blockNumber);
    });

    // remove in prod
    const unpongedTxHashes = unpongedPings.map(
      (unpongedPing) => unpongedPing.transactionHash
    );

    console.log("unpongedTxHashes:", unpongedTxHashes);
    console.log("number of unpongedTxHashes", unpongedTxHashes.length);

    const nonceOfLatestPonged = this.pong.getLatestPongedNonce(myPongDetails);

    await this.pong.pongUnpongedPings(
      unpongedPings,
      nonceOfLatestPonged,
      contractClient.public
    );

    // * we wait a couple of blocks after the inital catch-up txs in order to let them process/fail. So we can check them in the listener
    // * latestBlockNumber tracks this block number, so we can wait a couple block before permitting listener to act in handlePingEvents
    const initBlockNumber = await getBlockNumber(contractClient.public);
    return initBlockNumber;
  };

  private fetchPingPongEvents = async (
    fromBlockNumber: bigint
  ): Promise<PingPongEvents | undefined> => {
    const pingEventsPromise = this.ping.fetchEvents(fromBlockNumber);
    const pongEventsPromise = this.pong.fetchEvents(fromBlockNumber);

    const [pingEvents, pongEvents] = await Promise.all([
      pingEventsPromise,
      pongEventsPromise,
    ]);

    if (!pingEvents || !pongEvents) return;

    return { pingEvents, pongEvents };
  };

  private getUnpongedPings = async (
    { pingEvents, pongEvents }: PingPongEvents,
    myPongDetails: PongDetails
  ): Promise<PingEvents> => {
    const myPongEvents = this.pong.filterOutOthersPongEvents(
      pongEvents,
      myPongDetails
    );

    const unPongedPingEventsInteral = this.filterOutPonged(
      pingEvents,
      myPongEvents
    );

    return unPongedPingEventsInteral;
  };

  private filterOutPonged = (
    pingEvents: PingEvents,
    myPongEvents: PongEvents
  ) => {
    const unPongedPingEventsInteral = pingEvents.filter((pingEvent) => {
      const isPonged = myPongEvents.some((myPongEvent) =>
        areEthereumHashesEqual(myPongEvent.data, pingEvent.transactionHash)
      );
      return !isPonged;
    });
    return unPongedPingEventsInteral;
  };
}

export type ContractClient = {
  public: PublicClient;
  wallet: WalletClient;
  pollingInterval?: number;
};

export type PingPongContract = PingPong["contract"];

interface PingPongEvents {
  pingEvents: PingEvents;
  pongEvents: PongEvents;
}
