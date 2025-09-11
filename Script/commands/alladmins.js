const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "alladmins",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Trae AI",
    description: "Display all bot administrators",
    commandCategory: "info",
    usages: "/alladmins",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    try {
        // Read config file to get admin IDs
        const configPath = path.resolve(__dirname, '../../config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const adminIds = config.ADMINBOT || [];
        const ndhIds = config.NDH || [];
        
        if (adminIds.length === 0) {
            return api.sendMessage("❌ No admins found in the configuration.", event.threadID, event.messageID);
        }
        
        // Get thread participants to check if admins are in the current thread
        let threadInfo;
        try {
            threadInfo = await api.getThreadInfo(event.threadID);
        } catch (e) {
            threadInfo = { participantIDs: [] };
        }
        const participantIds = threadInfo.participantIDs || [];
        
        // Try to get admin names using Facebook API
        let adminInfo;
        try {
            adminInfo = await api.getUserInfo(adminIds);
        } catch (err) {
            // If we can't get user info, we'll just show IDs
            adminInfo = {};
        }
        
        // Prepare admin list message
        let message = "👑 𝗕𝗢𝗧 𝗔𝗗𝗠𝗜𝗡𝗦 👑\n\n";
        
        for (const adminId of adminIds) {
            const isInThread = participantIds.includes(adminId);
            const statusEmoji = isInThread ? "🟢" : "🔴";
            const isNDH = ndhIds.includes(adminId);
            const ndhBadge = isNDH ? "👑 " : "";
            
            const name = adminInfo[adminId] ? adminInfo[adminId].name : adminId;
            message += `${statusEmoji} ${ndhBadge}${name} (${adminId})\n`;
        }
        
        // Add legend
        message += "\n𝗟𝗘𝗚𝗘𝗡𝗗:\n";
        message += "🟢 = Active in this thread\n";
        message += "🔴 = Not in this thread\n";
        message += "👑 = Super Admin\n";
        
        return api.sendMessage(message, event.threadID, event.messageID);
    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ An error occurred while retrieving admin information.", event.threadID, event.messageID);
    }
};