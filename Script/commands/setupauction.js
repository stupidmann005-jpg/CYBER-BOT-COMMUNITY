module.exports = {
    config: {
        name: "setupauction",
        version: "1.0.0",
        hasPermssion: 2,
        credits: "CyberBot",
        description: "Initialize auction system database",
        commandCategory: "system",
        usages: "",
        cooldowns: 5,
    },
    run: async function ({ api, event }) {
        try {
            // Import the models
            const { AuctionItems, AuctionBids } = require("../../includes/database/models/auction");
            
            // Sync the models with the database
            await AuctionItems.sync();
            await AuctionBids.sync();

            // Create required directories
            const fs = require('fs-extra');
            const path = require('path');
            const cacheDir = path.join(__dirname, '..', '..', 'includes', 'cache');
            await fs.ensureDir(cacheDir);

            // Initialize config files
            const configs = {
                'auction_config.json': { 
                    auctionDuration: 120,  // 2 minutes
                    timeBetweenAuctions: 300  // 5 minutes
                }
            };

            for (const [file, defaultContent] of Object.entries(configs)) {
                const filePath = path.join(cacheDir, file);
                if (!await fs.exists(filePath)) {
                    await fs.writeJson(filePath, defaultContent, { spaces: 2 });
                }
            }

            // Send success message
            return api.sendMessage(
                "✅ Auction system initialized successfully!\n\n" +
                "Available commands:\n" +
                "- /additem - Add items to auction\n" +
                "- /bid - Place bids on current item\n" +
                "- /auction - View current auction\n" +
                "- /listauctions - View all items up for auction\n\n" +
                "The auction system will automatically start running auctions every 5 minutes.",
                event.threadID
            );

        } catch (error) {
            console.error('Setup error:', error);
            return api.sendMessage(
                "❌ Error initializing auction system: " + error.message,
                event.threadID
            );
        }
    }
};
