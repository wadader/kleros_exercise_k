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
}

type OptionalStringProperties<T> = {
  [K in keyof T]: string | undefined;
};

export interface EnvClassConstructorArgs {
  alchemyEnv: OptionalStringProperties<AlchemyEnv>;
  pingPongEnv: OptionalStringProperties<PingPongEnv>;
  appEnv: OptionalStringProperties<AppEnv>;
}
