import { PublicClient, WalletClient, getContract } from "viem";
import { PINGPONG_ABI } from "../../artifacts/pingPongAbi";
import { getPongerClient, getPublicClient } from "../../config/ethClients";
import { EthAddress } from "../../types/web3";

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
  }

  contract;
}

export type ContractClient = {
  public: PublicClient;
  wallet: WalletClient;
  pollingInterval?: number;
};

export type PingPongContract = PingPong["contract"];
