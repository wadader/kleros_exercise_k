import { PingPongContract } from "./pingPong";

export class Ping {
  constructor(_pingPongContract: PingPongContract) {
    this.contract = _pingPongContract;
  }
  fetchEvents = async (fromBlockNumber: bigint) => {
    try {
      return await this.contract.getEvents.Ping({
        fromBlock: fromBlockNumber,
      });
    } catch (e) {
      console.error("ping-fetch-events-error:", e);
    }
  };
  contract: PingPongContract;
}

export type PingEvents = NonNullable<Awaited<ReturnType<Ping["fetchEvents"]>>>;
