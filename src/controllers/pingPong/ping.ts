import { PingPongContract } from "./pingPong";

export class Ping {
  constructor(_pingPongContract: PingPongContract) {
    this.contract = _pingPongContract;
  }
  fetchEvents = async (fromBlockNumber: bigint) => {
    return await this.contract.getEvents.Ping({
      fromBlock: fromBlockNumber,
    });
  };
  contract: PingPongContract;
}

export type PingEvents = Awaited<ReturnType<Ping["fetchEvents"]>>;
