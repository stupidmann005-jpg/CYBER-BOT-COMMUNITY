const { EnabledThreads } = require('../../includes/database/models/auctionModels');

module.exports = {
    config: {
        name: "checkauctionstate",  // Changed name to avoid conflicts
        version: "1.0.0",
        hasPermssion: 1,  // Admin only
        credits: "CyberBot",
        description: "Check if auctions are enabled in this thread",
        commandCategory: "economy",
        usages: "",
        cooldowns: 5
    },
    run: async function({ api, event }) {
        const { threadID } = event;

        try {
            // Check database for thread state
            const threadSettings = await EnabledThreads.findOne({
                where: { threadID: threadID }
            });

            if (!threadSettings || !threadSettings.enabled) {
                return api.sendMessage(
                    "⚠️ Auctions are not enabled in this chat.\n\n" +
                    "Admin commands:\n" +
                    "• /enableauction - Turn on auctions\n" +
                    "• /disableauction - Turn off auctions",
                    threadID
                );
            }

            return api.sendMessage(
                "✅ Auctions are enabled in this chat!\n\n" +
                "Available commands:\n" +
                "• /viewauction - View current auction\n" +
                "• /bid <amount> - Place a bid\n" +
                "• /additem2 - Add an item (Admin)\n" +
                "• /showqueue - View pending items",
                threadID
            );

        } catch (error) {
            console.error('Error checking auction state:', error);
            return api.sendMessage(
                '❌ Failed to check auction status. Please try again.',
                threadID
            );
        }
    }
};