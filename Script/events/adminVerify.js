module.exports.config = {
	name: "adminVerify",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "Modified by Trae AI",
	description: "Verify admin permissions at startup",
	eventType: ["ready"]
};

module.exports.run = async function({ api, event, client }) {
	const { writeFileSync, readFileSync, existsSync } = require("fs-extra");
	const { configPath } = global.client;
	const logger = require("../../utils/log");
	
	try {
		// Check if config file exists
		if (!existsSync(configPath)) {
			logger("Config file not found", "error");
			return;
		}
		
		// Load config file
		delete require.cache[require.resolve(configPath)];
		const config = require(configPath);
		
		// Verify ADMINBOT array exists
		if (!config.ADMINBOT || !Array.isArray(config.ADMINBOT)) {
			logger("ADMINBOT array not found in config, creating it", "warn");
			config.ADMINBOT = [];
		}
		
		// Ensure global config is updated
		global.config.ADMINBOT = config.ADMINBOT;
		
		// Create backup path
		const backupPath = configPath.replace("config.json", "admin_backup.json");
		
		// Create backup if it doesn't exist
		if (!existsSync(backupPath)) {
			const backupData = {
				ADMINBOT: config.ADMINBOT || [],
				NDH: config.NDH || [],
				backupDate: Date.now()
			};
			
			writeFileSync(backupPath, JSON.stringify(backupData, null, 4), 'utf8');
			logger("Created admin backup file", "info");
		}
		
		// Log admin count
		logger(`Verified ${config.ADMINBOT.length} admins at startup`, "info");
	} catch (error) {
		logger(`Error verifying admin permissions: ${error.message}`, "error");
	}
}