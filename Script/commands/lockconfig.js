module.exports.config = {
	name: "lockconfig",
	version: "1.0.0",
	hasPermssion: 2,
	credits: "Trae AI",
	description: "Lock or unlock configuration to prevent automatic restoration",
	commandCategory: "Admin",
	usages: "lockconfig [on/off]",
	cooldowns: 5,
	dependencies: {
		"fs-extra": ""
	}
};

module.exports.languages = {
	"vi": {
		"notHavePermssion": '[Admin] Bạn không đủ quyền hạn để có thể sử dụng chức năng này',
		"lockSuccess": '[Admin] Đã khóa cấu hình thành công, các thay đổi sẽ không bị hoàn tác tự động',
		"unlockSuccess": '[Admin] Đã mở khóa cấu hình thành công, các thay đổi có thể bị hoàn tác tự động',
		"currentStatus": '[Admin] Trạng thái khóa cấu hình hiện tại: %1'
	},
	"en": {
		"notHavePermssion": '[Admin] You don\'t have permission to use this command',
		"lockSuccess": '[Admin] Successfully locked configuration, changes will not be automatically reverted',
		"unlockSuccess": '[Admin] Successfully unlocked configuration, changes may be automatically reverted',
		"currentStatus": '[Admin] Current configuration lock status: %1'
	}
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
	const { threadID, messageID } = event;
	const { configPath } = global.client;
	const { writeFileSync, readFileSync, existsSync } = global.nodemodule["fs-extra"];
	const lockPath = configPath.replace("config.json", "config.lock");
	
	// Check if user has permission to use this command
	if (permssion < 2) return api.sendMessage(getText("notHavePermssion"), threadID, messageID);
	
	// Check current lock status
	const isLocked = existsSync(lockPath);
	
	// If no arguments provided, show current status
	if (args.length === 0) {
		return api.sendMessage(
			getText("currentStatus").replace("%1", isLocked ? "ON" : "OFF"), 
			threadID, 
			messageID
		);
	}
	
	// Handle lock command
	if (args[0].toLowerCase() === "on") {
		try {
			// Load current config
			delete require.cache[require.resolve(configPath)];
			const config = require(configPath);
			
			// Create lock file with current config
			writeFileSync(lockPath, JSON.stringify(config, null, 4), 'utf8');
			
			// Override the reload and load commands
			const overrideReload = function() {
				// If lock exists, load from lock instead of config
				if (existsSync(lockPath)) {
					const lockedConfig = JSON.parse(readFileSync(lockPath, 'utf8'));
					global.config = lockedConfig;
					// Also update the actual config file to match the locked version
					writeFileSync(configPath, JSON.stringify(lockedConfig, null, 4), 'utf8');
					return true;
				}
				return false;
			};
			
			// Attach the override function to global
			global.configLocked = true;
			global.configLockOverride = overrideReload;
			
			// Execute the override once to ensure current config is protected
			overrideReload();
			
			return api.sendMessage(getText("lockSuccess"), threadID, messageID);
		} catch (error) {
			return api.sendMessage(`[Error] Failed to lock configuration: ${error.message}`, threadID, messageID);
		}
	}
	
	// Handle unlock command
	if (args[0].toLowerCase() === "off") {
		try {
			// Remove lock file if it exists
			if (existsSync(lockPath)) {
				const { unlinkSync } = global.nodemodule["fs-extra"];
				unlinkSync(lockPath);
			}
			
			// Remove the override
			global.configLocked = false;
			global.configLockOverride = null;
			
			return api.sendMessage(getText("unlockSuccess"), threadID, messageID);
		} catch (error) {
			return api.sendMessage(`[Error] Failed to unlock configuration: ${error.message}`, threadID, messageID);
		}
	}
	
	return api.sendMessage(`[Admin] Invalid command. Usage: lockconfig [on/off]`, threadID, messageID);
};