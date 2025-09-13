const { DataTypes } = require('sequelize');
const fs = require('fs-extra');
const path = require('path');

const fs = require('fs-extra');
const path = require('path');

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
            const fs = require('fs-extra');
            const path = require('path');
            const { sequelize } = require("../../includes/database/database");
            const { AuctionItems, AuctionBids } = require("../../includes/database/models/auction");

            // Sync the database
            await sequelize.sync();

            // Sync all tables
            await sequelize.sync();

            // Create required directories
            const cacheDir = path.join(__dirname, '..', '..', 'includes', 'cache');
            await fs.ensureDir(cacheDir);

            // Initialize config files
            const configs = {
                'auction_config.json': { auctionDurationMinutes: 2 },
                'auction_threads.json': [],
                'auction_queue.json': []
            };

            for (const [file, defaultContent] of Object.entries(configs)) {
                const filePath = path.join(cacheDir, file);
                if (!await fs.exists(filePath)) {
                    await fs.writeJson(filePath, defaultContent, { spaces: 2 });
                }
            }

            return api.sendMessage('✅ Auction system has been initialized successfully!', event.threadID);
        } catch (error) {
            console.error('Setup error:', error);
            return api.sendMessage('❌ Error initializing auction system. Check console for details.', event.threadID);
        }
    }
};
