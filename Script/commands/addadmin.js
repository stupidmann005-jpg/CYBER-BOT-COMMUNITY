module.exports.config = {
	name: "addadmin",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
	description: "Add a user as a bot admin",
	commandCategory: "Admin",
	usages: "addadmin [uid] or [mention]",
	cooldowns: 5,
	dependencies: {
		"fs-extra": ""
	}
};

module.exports.languages = {
	"vi": {
		"notHavePermssion": '[Admin] Bạn không đủ quyền hạn để có thể sử dụng chức năng này',
		"addedNewAdmin": '[Admin] Đã thêm %1 người dùng trở thành người điều hành bot:\n\n%2'
	},
	"en": {
		"notHavePermssion": '[Admin] You don\'t have permission to use this command',
		"addedNewAdmin": '[Admin] Successfully added %1 user as bot admin:\n\n%2'
	}
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
	const content = args.slice(1, args.length);
	const { threadID, messageID, mentions } = event;
	const { configPath } = global.client;
	const { ADMINBOT } = global.config;
	const { userName } = global.data;
	const { writeFileSync } = global.nodemodule["fs-extra"];
	const mention = Object.keys(mentions);
	
	delete require.cache[require.resolve(configPath)];
	var config = require(configPath);
	
	// Check if user has permission to add admins
	if (permssion < 2) return api.sendMessage(getText("notHavePermssion"), threadID, messageID);
	
	// Handle reply message to add user as admin
	if (event.type == "message_reply") {
		const uid = event.messageReply.senderID;
		if (ADMINBOT.includes(uid)) {
			return api.sendMessage(`[Admin] This user is already a bot admin`, threadID, messageID);
		}
		
		ADMINBOT.push(uid);
		config.ADMINBOT.push(uid);
		
		const name = await Users.getNameUser(uid);
		writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
		return api.sendMessage(getText("addedNewAdmin", 1, `${name} (https://facebook.com/${uid})`), threadID, messageID);
	}
	
	// Handle mentions to add users as admins
	if (mention.length != 0 && isNaN(args[0])) {
		var listAdd = [];
		
		for (const id of mention) {
			if (ADMINBOT.includes(id)) {
				return api.sendMessage(`[Admin] User ${event.mentions[id]} is already a bot admin`, threadID, messageID);
			}
			
			ADMINBOT.push(id);
			config.ADMINBOT.push(id);
			listAdd.push(`${event.mentions[id]} (https://facebook.com/${id})`);
		}
		
		writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
		return api.sendMessage(getText("addedNewAdmin", mention.length, listAdd.join("\n")), threadID, messageID);
	}
	
	// Handle user ID to add as admin
	if (args.length != 0 && !isNaN(args[0])) {
		const uid = args[0];
		if (ADMINBOT.includes(uid)) {
			return api.sendMessage(`[Admin] This user is already a bot admin`, threadID, messageID);
		}
		
		ADMINBOT.push(uid);
		config.ADMINBOT.push(uid);
		
		const name = await Users.getNameUser(uid);
		writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
		return api.sendMessage(getText("addedNewAdmin", 1, `${name} (https://facebook.com/${uid})`), threadID, messageID);
	}
	
	return api.sendMessage(`[Admin] Usage: addadmin [uid] or tag someone to add as admin`, threadID, messageID);
}