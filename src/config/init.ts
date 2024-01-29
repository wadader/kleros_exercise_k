import { Env_Vars } from "./env";
import { PingPong } from "../controllers/pingPong/pingPong";
import { EnvClassConstructorArgs } from "./types";

const envArg: EnvClassConstructorArgs = {
  alchemyEnv: {
    ALCHEMY_KEY: process.env.ALCHEMY_KEY,
  },
  pingPongEnv: {
    PONGER_KEY: process.env.PONGER_KEY,
    PINGPONG_ADDRESS: process.env.PINGPONG_ADDRESS,
    PINGPONG_STARTING_BLOCK: process.env.PINGPONG_STARTING_BLOCK
  },
  appEnv: {
    BACKEND_PORT: process.env.BACKEND_PORT,
  },
};

export const env_Vars = new Env_Vars(envArg);

export const pingPong = new PingPong(
  env_Vars.Alchemy.ALCHEMY_KEY,
  env_Vars.PingPong
);
