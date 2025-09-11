module.exports.config = {
	name: "reload",
	version: "1.0.0",
	hasPermssion: 1,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
	description: "The bot command will restarts",
	commandCategory: "Penguin",
	usages: "reload + time",
	cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
 const permission = global.config.GOD;
  	if (!permission.includes(event.senderID)) return api.sendMessage(`⚠️You don't have permission to use this command!`, event.threadID, event.messageID);
	const { threadID, messageID } = event;
	
	// Check if config is locked before reloading
	const { existsSync } = require('fs-extra');
	const lockPath = global.client.configPath.replace("config.json", "config.lock");
	const isLocked = existsSync(lockPath);
	
	var time = args.join(" ");
	var rstime = "68";
	if (!time) rstime = "69";
	else rstime = time;
	
	let message = `[Bot] => Will reload the bot later ${rstime} second more !`;
	if (isLocked) {
		message += "\n[Note] => Configuration is locked. Your settings will be preserved after reload.";
	}
	
	api.sendMessage(message, threadID);
	return setTimeout(() => { api.sendMessage("[Bot] => Reloading Bot !",event.threadID,() => process.exit(1) )},	rstime * 1000);
}
