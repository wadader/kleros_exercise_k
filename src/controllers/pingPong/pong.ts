import { PublicClient, WalletClient, isAddressEqual } from "viem";
import { ContractClient, PingPongContract } from "./pingPong";
import { areEthereumHashesEqual } from "../../types/web3";

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

export type PongEvents = Awaited<ReturnType<Pong["fetchEvents"]>>;
export type PongDetails = Awaited<ReturnType<Pong["getAllDetails"]>>;
