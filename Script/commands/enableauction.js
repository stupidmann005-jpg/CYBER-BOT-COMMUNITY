const { EnabledThreads } = require('../../includes/database/models');

module.exports.config = {
    name: "enableauction",
    version: "1.0.0",
    hasPermssion: 1, // Admin only
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Enable auction announcements in this thread",
    commandCategory: "economy",
    usages: "",
    cooldowns: 5,
    envConfig: {}
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
        // Check if thread is already enabled
        let threadSettings = await EnabledThreads.findOne({
            where: { threadID: threadID }
        });

        if (threadSettings) {
            // Toggle enabled status
            const newStatus = !threadSettings.enabled;
            await threadSettings.update({ enabled: newStatus });
            return api.sendMessage(
                newStatus 
                    ? '✅ Auctions have been enabled in this group!\n\n' +
                      '🎉 You will receive notifications when:\n' +
                      '- New auctions start\n' +
                      '- Bids are placed\n' +
                      '- Auctions end\n\n' +
                      'Use these commands:\n' +
                      '/additem - Add item to auction\n' +
                      '/bid <amount> - Place a bid\n' +
                      '/auction - View current auction\n' +
                      '/showqueue - View pending items'
                    : '❌ Auctions have been disabled in this group.\n' +
                      'You will no longer receive auction announcements.',
                threadID
            );
        } else {
            // Create new enabled thread entry
            await EnabledThreads.create({
                threadID: threadID,
                enabled: true
            });
            return api.sendMessage(
                '✅ Auctions have been enabled in this group!\n\n' +
                '🎉 You will receive notifications when:\n' +
                '- New auctions start\n' +
                '- Bids are placed\n' +
                '- Auctions end\n\n' +
                'Use these commands:\n' +
                '/additem - Add item to auction\n' +
                '/bid <amount> - Place a bid\n' +
                '/auction - View current auction\n' +
                '/showqueue - View pending items',
                threadID
            );
        }
    } catch (error) {
        console.error('Error in enableauction command:', error);
        return api.sendMessage('❌ An error occurred while trying to enable auctions.', threadID);
    }
};
