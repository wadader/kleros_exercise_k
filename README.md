# Ping Pong

Create a bot that pongs *exactly once* for each ping and is **robust**  

## Solution Summary
1. First, get all *unpongedPings* after the specified **startingBlock**.
1. Pong them. Keep a track of the pong nonces, so duplicate transactions are not sent. 
2. Listen for incoming blocks. On every third, get *unpongedPings* and pong them again.



### Criteria 1 : Pong Exactly Once

1. We get pings and our pongs and ignore the already *ponged* pings.
2. We keep track of the nonces of the pongs (refer to assumption 1).
3. We pong(*pong the verb*) pings by their nonce, so lower nonce pings have lower nonce pongs.
4. Hence, no duplicate txs are sent


### Criteria 2 : Robustness
#### 1. Network Failure:
- Network failure will cause event fetches to fail
- These fails are ignored. We wait until the next block cycle and try and fetch then.
- As we get all events from the startingblock specified, we do not miss any pings due to network outage.

#### 2. Rate Limited by Provider:
- Exponential backoff strategy in case of rate limit by provider
    - https://docs.alchemy.com/reference/throughput#option-4-exponential-backoff
    - If rate limited, retry after delay that increases each time that tx is rate limited
- I'm using an alchemy provider, but code could be modified to be more generic

#### 3. Spike in Gas Prices; Pong Doesn't get mined:
- Pong won't be mined by next block cycle
- Tx will be submitted again in next block cycle as a replacement tx
- If tx is underpriced, submit again with a >10% increase each time failed due to underpriced

### 4. Restarts
- Can be restarted at any time and pick up unponged pings. No problem

## Assumptions

1. A dedicated ethereum account is created and used by the bot
2. Reaction to pings is not expected to be real-time

## Drawbacks

1. Need to wait for blocks
    1. Waiting for every third block to give lagging txs a bit to mine.
    2. Could be done for two or every block.
        - But puts a load on the provider in case where there are tonnes of unponged pings.
        - They'll still be processed without duplicates but slower (for the first some unponed pings) because you'll get rate limited a lot until they're all done