module.exports.config = {
	name: "adminbackup",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "Modified by Trae AI",
	description: "Backup and restore admin settings",
	commandCategory: "Admin",
	usages: "adminbackup [backup/restore]",
	cooldowns: 5,
	dependencies: {
		"fs-extra": ""
	}
};

module.exports.languages = {
	"vi": {
		"notHavePermssion": '[Admin] Bạn không đủ quyền hạn để có thể sử dụng chức năng này',
		"backupSuccess": '[Admin] Đã sao lưu danh sách admin thành công',
		"restoreSuccess": '[Admin] Đã khôi phục danh sách admin thành công'
	},
	"en": {
		"notHavePermssion": '[Admin] You don\'t have permission to use this command',
		"backupSuccess": '[Admin] Successfully backed up admin list',
		"restoreSuccess": '[Admin] Successfully restored admin list'
	}
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
	const { threadID, messageID } = event;
	const { configPath } = global.client;
	const { writeFileSync, readFileSync, existsSync } = global.nodemodule["fs-extra"];
	const backupPath = configPath.replace("config.json", "admin_backup.json");
	
	// Check if user has permission to use this command
	if (permssion < 2) return api.sendMessage(getText("notHavePermssion"), threadID, messageID);
	
	// If no arguments provided, show usage
	if (args.length === 0) {
		return api.sendMessage(`[Admin] Usage: adminbackup [backup/restore]`, threadID, messageID);
	}
	
	// Handle backup command
	if (args[0] === "backup") {
		try {
			// Load current config
			delete require.cache[require.resolve(configPath)];
			const config = require(configPath);
			
			// Create backup object with just the admin data
			const backupData = {
				ADMINBOT: config.ADMINBOT || [],
				NDH: config.NDH || [],
				backupDate: Date.now()
			};
			
			// Write backup to file
			writeFileSync(backupPath, JSON.stringify(backupData, null, 4), 'utf8');
			return api.sendMessage(getText("backupSuccess"), threadID, messageID);
		} catch (error) {
			return api.sendMessage(`[Error] Failed to backup admin list: ${error.message}`, threadID, messageID);
		}
	}
	
	// Handle restore command
	if (args[0] === "restore") {
		try {
			// Check if backup file exists
			if (!existsSync(backupPath)) {
				return api.sendMessage(`[Error] No backup file found at ${backupPath}`, threadID, messageID);
			}
			
			// Check if config is locked
			const lockPath = configPath.replace("config.json", "config.lock");
			const isLocked = existsSync(lockPath);
			
			if (isLocked && global.configLocked) {
				return api.sendMessage(`[Error] Configuration is currently locked. Use '/lockconfig off' to disable locking before restoring.`, threadID, messageID);
			}
			
			// Load backup data
			const backupData = JSON.parse(readFileSync(backupPath, 'utf8'));
			
			// Load current config
			delete require.cache[require.resolve(configPath)];
			const config = require(configPath);
			
			// Restore admin data
			config.ADMINBOT = backupData.ADMINBOT || config.ADMINBOT;
			if (backupData.NDH) config.NDH = backupData.NDH;
			
			// Update global config
			global.config.ADMINBOT = config.ADMINBOT;
			if (backupData.NDH) global.config.NDH = config.NDH;
			
			// Write updated config
			writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
			return api.sendMessage(getText("restoreSuccess"), threadID, messageID);
		} catch (error) {
			return api.sendMessage(`[Error] Failed to restore admin list: ${error.message}`, threadID, messageID);
		}
	}
	
	return api.sendMessage(`[Admin] Invalid command. Usage: adminbackup [backup/restore]`, threadID, messageID);
}
