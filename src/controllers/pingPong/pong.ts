import { PingPongContract } from "./pingPong";

export class Pong {
  constructor(_pingPongContract: PingPongContract) {
    this.contract = _pingPongContract;
  }

  fetchEvents = async (fromBlockNumber: bigint) => {
    return await this.contract.getEvents.Pong({
      fromBlock: fromBlockNumber,
    });
  };

  contract: PingPongContract;
}

export type PongEvents = Awaited<ReturnType<Pong["fetchEvents"]>>;
