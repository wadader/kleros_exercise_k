import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, goerli } from "viem/chains";
import { env_Vars } from "./init";

const CHAINS = {
  sepolia: {
    viemChain: sepolia,
    getHttpSocketUrl: (_alchemyKey: string) =>
      http(`https://eth-sepolia.g.alchemy.com/v2/${_alchemyKey}`),
  },
  goerli: {
    viemChain: goerli,
    getHttpSocketUrl: (_alchemyKey: string) =>
      http(`https://eth-sepolia.g.alchemy.com/v2/${_alchemyKey}`),
  },
} as const;

const selectedChain =
  env_Vars.PingPong.GOERLI_OR_SEPOLIA === "Goerli"
    ? CHAINS.goerli
    : CHAINS.sepolia;

export const getPublicClient = (_alchemyKey: string) =>
  createPublicClient({
    chain: selectedChain.viemChain,
    transport: selectedChain.getHttpSocketUrl(_alchemyKey),
    batch: {
      multicall: true,
    },
  });

const getPongerAccount = (_pongerPrivateKey: string) =>
  privateKeyToAccount(`0x${_pongerPrivateKey}`);

export const getPongerClient = (
  _pongerPrivateKey: string,
  _alchemyKey: string
) =>
  createWalletClient({
    account: getPongerAccount(_pongerPrivateKey),
    chain: selectedChain.viemChain,
    transport: selectedChain.getHttpSocketUrl(_alchemyKey),
  });
