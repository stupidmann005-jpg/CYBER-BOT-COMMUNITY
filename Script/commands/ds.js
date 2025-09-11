module.exports.config = {
    name: "ds",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "View bot dashboard with group information",
    commandCategory: "system",
    usages: "ds",
    cooldowns: 5
};

module.exports.onLoad = function() {
    try {
        const dashboard = require('../../dashboard/server');
        dashboard.initialize();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;
    
    try {
        const dashboard = require('../../dashboard/server');
        const url = dashboard.getDashboardUrl();
        
        if (!url) {
            return api.sendMessage("❌ Dashboard server is not running. Please contact the bot administrator.", threadID, messageID);
        }
        
        // Add the current message to the dashboard
        const sender = await api.getUserInfo(event.senderID);
        const senderName = sender[event.senderID].name || "Unknown User";
        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo.threadName || "Unknown Group";
        
        dashboard.addMessage({
            senderID: event.senderID,
            senderName: senderName,
            threadID: threadID,
            threadName: threadName,
            body: event.body,
            timestamp: Date.now()
        });
        
        // Send dashboard link
        return api.sendMessage(
            `🌐 𝗖𝗬𝗕𝗘𝗥 𝗕𝗢𝗧 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗 🌐\n\n` +
            `Access the dashboard to view all connected groups, members, and live messages:\n\n` +
            `🔗 ${url}\n\n` +
            `The dashboard shows:\n` +
            `• All groups connected to this bot\n` +
            `• Group member information\n` +
            `• Live messages\n` +
            `• Group settings\n\n` +
            `Note: This link only works on the device where the bot is running.`,
            threadID, messageID
        );
    } catch (error) {
        console.error('Error in ds command:', error);
        return api.sendMessage("❌ An error occurred while accessing the dashboard. Please contact the bot administrator.", threadID, messageID);
    }
};
