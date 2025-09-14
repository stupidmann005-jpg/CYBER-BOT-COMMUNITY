const { EnabledThreads } = require('../../includes/database/models/auctionModels');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "checkauctionstate",
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
            // Ensure auction cache directory exists
            const cacheDir = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction');
            await fs.ensureDir(cacheDir);

            // Initialize thread settings in database if needed
            await EnabledThreads.sync();
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
