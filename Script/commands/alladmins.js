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
        let adminInfo = {};
        try {
            adminInfo = await api.getUserInfo(adminIds);
        } catch (err) {
            // If we can't get user info, we'll just show IDs
        }
        
        // Prepare admin list message with a more beautiful design
        let message = "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n";
        message += "┃     ⭐👑 𝐁𝐎𝐓 𝐀𝐃𝐌𝐈𝐍𝐈𝐒𝐓𝐑𝐀𝐓𝐎𝐑𝐒 👑⭐     \n";
        message += "┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n";
        
        for (let i = 0; i < adminIds.length; i++) {
            const adminId = adminIds[i];
            const isInThread = participantIds.includes(adminId);
            const statusEmoji = isInThread ? "🟢" : "🔴";
            
            const name = adminInfo[adminId] ? adminInfo[adminId].name : "Unknown";
            message += `┃ ${i+1}. ${statusEmoji} ${name}\n`;
            message += `┃    └─ 𝐈𝐃: ${adminId}\n`;
            if (i < adminIds.length - 1) {
                message += "┃\n";
            }
        }
        
        // Add legend and total count
        message += "┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n";
        message += `┃ 📊 𝐓𝐨𝐭𝐚𝐥 𝐀𝐝𝐦𝐢𝐧𝐬: ${adminIds.length}\n`;
        message += "┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n";
        message += "┃ 🟢 = 𝐀𝐜𝐭𝐢𝐯𝐞 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐭𝐡𝐫𝐞𝐚𝐝\n";
        message += "┃ 🔴 = 𝐍𝐨𝐭 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐭𝐡𝐫𝐞𝐚𝐝\n";
        message += "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛";
        
        return api.sendMessage(message, event.threadID, event.messageID);
    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ An error occurred while retrieving admin information.", event.threadID, event.messageID);
    }
};
