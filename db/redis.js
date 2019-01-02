const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient();

client.on("error", err => {
  console.log(`Error: ${err}`);
  client.quit();
});

client.on("connect", async () => {
  const getAsync = promisify(client.get).bind(client);
  const res = getAsync("count");
  if (!res) {
    client.set("count", 0);
  }
});

module.exports = client;
