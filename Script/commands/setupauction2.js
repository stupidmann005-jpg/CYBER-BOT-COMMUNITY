const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "setupauction2",
        version: "1.0.0",
        hasPermssion: 2,
        credits: "CyberBot",
        description: "Initialize auction system database",
        commandCategory: "auction",
        cooldowns: 5
    },
    run: async function({ api, event }) {
        try {
            const { sequelize } = require("../../includes/database/database");

            // Create cache directories
            const cacheDir = path.join(__dirname, '..', '..', 'includes', 'cache');
            const auctionDir = path.join(cacheDir, 'auction');
            const imageDir = path.join(auctionDir, 'images');
            
            await fs.ensureDir(cacheDir);
            await fs.ensureDir(auctionDir);
            await fs.ensureDir(imageDir);

            // Initialize config files
            const configs = {
                'auction_config.json': {
                    auctionDurationMinutes: 2,
                    minBidIncrement: 50,
                    enableAutoStart: true,
                    maxActiveAuctions: 1,
                    cooldownMinutes: 1
                },
                'auction_threads.json': [],
                'auction_queue.json': []
            };

            for (const [file, defaultContent] of Object.entries(configs)) {
                const filePath = path.join(auctionDir, file);
                if (!await fs.exists(filePath)) {
                    await fs.writeJson(filePath, defaultContent, { spaces: 2 });
                }
            }

            // Sync database
            await sequelize.sync();

            return api.sendMessage(
                '✅ Auction system initialized successfully!\n\n' +
                '📁 Created directories:\n' +
                '   • Cache directory\n' +
                '   • Auction directory\n' +
                '   • Image storage\n\n' +
                '📝 Created config files:\n' +
                '   • Auction settings\n' +
                '   • Thread tracking\n' +
                '   • Queue management\n\n' +
                '🔄 Database synchronized',
                event.threadID
            );
        } catch (error) {
            console.error('Setup error:', error);
            return api.sendMessage(
                '❌ Error initializing auction system.\n\n' +
                'Error details: ' + error.message,
                event.threadID
            );
        }
    }
};