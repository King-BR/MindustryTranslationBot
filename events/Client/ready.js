const botUtils = require("../../utils.js");
const { prefix } = require("../../config.json");

module.exports = (client) => {
  newError = botUtils.newError;

  try {
    console.log(`\nBot is logged in as: ${client.user.tag}`)

    client.user.setActivity(`${prefix}help`, { type: "WATCHING" });

  } catch (err) {
    console.log(`=> ${newError(err, "ClientReady")}`);
  }
}