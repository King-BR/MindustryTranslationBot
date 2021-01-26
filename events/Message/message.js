const config = require('../../config.json');
const botUtils = require("../../utils.js");
prefix = config.prefix;

module.exports = async (client, message) => {
	newError = botUtils.newError;

	try {
		let messageArray = message.content.split(/ +/);
		let cmd = messageArray[0].toLowerCase();
		let args = messageArray.slice(1);

		if (message.author.bot) return;
		if (!message.content.startsWith(prefix)) return;

		let commandfile =
			client.commands.get(cmd.slice(prefix.length)) ||
			client.commands.get(client.aliases.get(cmd.slice(prefix.length)));

		if (commandfile) commandfile.run(client, message, args);
	} catch (err) {
	  let IDs = {
			server: message.guild.id,
			user: message.author.id,
			msg: message.id
		};
		console.log(`=> ${newError(err, 'ClientMessage', IDs)}`);
	}
};
