const fastify = require("fastify")();
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient({
  host: "localhost",
  port: 6379,
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

class ProbabilisticCache {
  constructor(client, probability = 0.5) {
    this.client = client;
    this.probability = probability;
  }

  async get(key) {
    const cacheHit = Math.random() < this.probability;
    if (cacheHit) {
      console.log(`Cache hit for key: ${key}`);
      return await getAsync(key);
    } else {
      console.log(`Cache miss for key: ${key}`);
      return null;
    }
  }

  async set(key, value) {
    return await setAsync(key, value);
  }
}

const cache = new ProbabilisticCache(client, 0.75);

fastify.get("/cache/:key", async (req, reply) => {
  const key = req.params.key;
  const cachedValue = await cache.get(key);

  if (cachedValue) {
    return { key, value: cachedValue };
  } else {
    const newValue = `Value for ${key}`;
    await cache.set(key, newValue);
    return { key, value: newValue };
  }
});

// Start Fastify server
fastify.listen({ port: 3000, host: "localhost" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
