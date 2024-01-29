import { EthAddress } from "../types/web3";

export interface AppEnv {
  BACKEND_PORT: number;
}

export interface AlchemyEnv {
  ALCHEMY_KEY: string;
}

export interface PingPongEnv {
  PONGER_KEY: string;
  PINGPONG_ADDRESS: EthAddress;
  PINGPONG_STARTING_BLOCK: number;
  GOERLI_OR_SEPOLIA: GoerliOrSepolia;
}

type OptionalStringProperties<T> = {
  [K in keyof T]: string | undefined;
};

export interface EnvClassConstructorArgs {
  alchemyEnv: OptionalStringProperties<AlchemyEnv>;
  pingPongEnv: OptionalStringProperties<PingPongEnv>;
  appEnv: OptionalStringProperties<AppEnv>;
}

export type GoerliOrSepolia = "GOERLI" | "SEPOLIA";

export function isGoerliOrSepolia(str: string): str is GoerliOrSepolia {
  return Boolean(
    str && typeof str === "string" && (str === "GOERLI" || str === "Sepolia")
  );
}
