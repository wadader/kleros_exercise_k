import express from "express";
import { env_Vars } from "./config/init";

const app = express();

app.get("/", (_req, res) => {
  res.json({
    message: "PingPong Bot Up",
    startingBlock: env_Vars.PingPong.PINGPONG_STARTING_BLOCK,
  });
});

// railway provides this PORT directly
const PORT = process.env.PORT || env_Vars.App.BACKEND_PORT;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT} - pingPongBot`);
});
