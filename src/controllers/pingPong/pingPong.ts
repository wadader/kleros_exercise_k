import { PublicClient, WalletClient, getContract } from "viem";
import { PINGPONG_ABI } from "../../artifacts/pingPongAbi";
import { getPongerClient, getPublicClient } from "../../config/ethClients";
import { EthAddress, areEthereumHashesEqual } from "../../types/web3";
import { Ping, PingEvents } from "./ping";
import { Pong, PongDetails, PongEvents } from "./pong";

export class PingPong {
  constructor(
    ALCHEMY_KEY: string,
    PINGPONG_ADDRESS: EthAddress,
    PONGER_PRIVATE_KEY: string
  ) {
    console.log("constructing PingPong");

    const publicClient = getPublicClient(ALCHEMY_KEY);
    const pongerClient = getPongerClient(PONGER_PRIVATE_KEY, ALCHEMY_KEY);

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
  }

  contract;
  ping: Ping;
  pong: Pong;

  private fetchPingPongEvents = async (
    fromBlockNumber: bigint
  ): Promise<PingPongEvents> => {
    const pingEventsPromise = this.ping.fetchEvents(fromBlockNumber);
    const pongEventsPromise = this.pong.fetchEvents(fromBlockNumber);
    const [pingEvents, pongEvents] = await Promise.all([
      pingEventsPromise,
      pongEventsPromise,
    ]);

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
  }

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