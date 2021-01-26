const Discord = require("discord.js");
const botUtils = require("../../utils.js");

/*
const GitHub = require("github-api");

var gh = new GitHub({
  token: process.env.GH_TOKEN
});
*/

module.exports = {
  run: async (client, message, args) => {
    newError = botUtils.newError;

    try {
      // Command code
    } catch (err) {
      let embed = new Discord.MessageEmbed()
        .setTitle("Erro inesperado")
        .setDescription("Um erro inesperado aconteceu. por favor contate os ADMs\n\nUm log foi criado com mais informações do erro");
      message.channel.send(embed);

      let IDs = {
        server: message.guild.id,
        user: message.author.id,
        msg: message.id
      }
      console.log(`=> ${newError(err, module.exports.config.name, IDs)}`);
    }
  },

  // Command configuration
  config: {
    name: "config",
    aliases: [],
    description: "configure the bot",
    usage: "config <option>",
    accessableby: "Admin"
  }
}