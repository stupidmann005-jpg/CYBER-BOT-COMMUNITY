module.exports.config = {
	name: "load",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
	description: "reload config file data",
	commandCategory: "Admin",
	usages: "[]",
	cooldowns: 30
};
module.exports.run = async function({ api, event, args,Threads, Users }) {
    // Check if config is locked
    const { existsSync, readFileSync } = require('fs-extra');
    const lockPath = global.client.configPath.replace("config.json", "config.lock");
    
    // If lock exists and the override function is available, use it
    if (existsSync(lockPath) && global.configLocked) {
        try {
            const lockedConfig = JSON.parse(readFileSync(lockPath, 'utf8'));
            global.config = lockedConfig;
            return api.sendMessage("[OK] Reloaded config from locked version. Use '/lockconfig off' to disable config locking.", event.threadID, event.messageID);
        } catch (error) {
            // If there's an error reading the lock, proceed with normal reload
            console.error("Error loading locked config:", error);
        }
    }
    
    // Normal reload process
    delete require.cache[require.resolve(global.client.configPath)];
    global.config = require(global.client.configPath);
    return api.sendMessage("[OK] Reloading config...", event.threadID, event.messageID);    
}
