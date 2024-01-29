import { isEthAddress } from "../types/web3";
import {
  AlchemyEnv,
  AppEnv,
  EnvClassConstructorArgs,
  PingPongEnv,
  isGoerliOrSepolia,
} from "./types";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

dotenv.config();

export class Env_Vars {
  constructor(envArgs: EnvClassConstructorArgs) {
    console.log("constructing env_vars - this message should only appear once");

    if (!envArgs.appEnv.BACKEND_PORT) throw "BACKEND_PORT not defined in env";
    this.App = { BACKEND_PORT: Number(envArgs.appEnv.BACKEND_PORT) };
    if (isNaN(this.App.BACKEND_PORT))
      throw "BACKEND_PORT does not seem like a number";

    if (!envArgs.alchemyEnv.ALCHEMY_KEY)
      throw "Alchemy API_KEY not defined in env";

    this.Alchemy = {
      ALCHEMY_KEY: envArgs.alchemyEnv.ALCHEMY_KEY,
    };

    if (!envArgs.pingPongEnv.PONGER_KEY) throw "PONGER_KEY not defined in env";
    if (!envArgs.pingPongEnv.PINGPONG_ADDRESS)
      throw "PINGPONG_ADDRESS not defined in env";
    if (!isEthAddress(envArgs.pingPongEnv.PINGPONG_ADDRESS))
      throw "PINGPONG_ADDRESS not eth address";
    if (!envArgs.pingPongEnv.PINGPONG_STARTING_BLOCK)
      throw "PING_PONG_STARTING_BLOCK not defined in env";

    const GoerliOrSepoliaString = envArgs.pingPongEnv.GOERLI_OR_SEPOLIA;
    if (!GoerliOrSepoliaString) throw "GOERLI_OR_SEPOLIA not defined in env";
    if (!isGoerliOrSepolia(GoerliOrSepoliaString))
      throw "Not GOERLI or SEPOLIA in env. Check case";

    this.PingPong = {
      PONGER_KEY: envArgs.pingPongEnv.PONGER_KEY,
      PINGPONG_ADDRESS: envArgs.pingPongEnv.PINGPONG_ADDRESS,
      PINGPONG_STARTING_BLOCK: Number(
        envArgs.pingPongEnv.PINGPONG_STARTING_BLOCK
      ),
      GOERLI_OR_SEPOLIA: GoerliOrSepoliaString,
    };

    if (isNaN(this.PingPong.PINGPONG_STARTING_BLOCK))
      throw "PINGPONG_STARTING_BLOCK does not seem like a number";

    if (!envArgs.appEnv.BACKEND_PORT)
      throw "PINGPONG_ADDRESS not defined in env";
  }

  readonly Alchemy: AlchemyEnv;
  readonly PingPong: PingPongEnv;
  readonly App: AppEnv;
}
