const { DataTypes } = require('sequelize');
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
    run: async function ({ api, event, sequelize }) {
        try {
            // Import existing models if they exist
            const { AuctionItems, AuctionBids, Auctions } = require("../../includes/database/models/auction");

            // If models don't exist, create them
            if (!AuctionItems) {
                // Initialize models
                await sequelize.define('AuctionItems', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        autoIncrement: true
                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    description: {
                        type: DataTypes.TEXT
                    },
                    imageURL: {
                        type: DataTypes.STRING
                    },
                    minimumBid: {
                        type: DataTypes.BIGINT,
                        defaultValue: 100
                    },
                    ownerID: {
                        type: DataTypes.STRING,
                        defaultValue: null
                    },
                    isForSale: {
                        type: DataTypes.BOOLEAN,
                        defaultValue: false
                    },
                    salePrice: {
                        type: DataTypes.BIGINT,
                        defaultValue: 0
                    }
                });
            }

            if (!AuctionBids) {
                await sequelize.define('AuctionBids', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        autoIncrement: true
                    },
                    auctionId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    itemId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    bidderID: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    amount: {
                        type: DataTypes.BIGINT,
                        allowNull: false
                    },
                    timestamp: {
                        type: DataTypes.DATE,
                        defaultValue: DataTypes.NOW
                    }
                });
            }

            if (!Auctions) {
                await sequelize.define('Auctions', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        autoIncrement: true
                    },
                    currentItemId: {
                        type: DataTypes.INTEGER,
                        defaultValue: null
                    },
                    currentAuctionStart: {
                        type: DataTypes.DATE,
                        defaultValue: null
                    },
                    currentAuctionEnd: {
                        type: DataTypes.DATE,
                        defaultValue: null
                    },
                    highestBidAmount: {
                        type: DataTypes.BIGINT,
                        defaultValue: 0
                    },
                    highestBidderID: {
                        type: DataTypes.STRING,
                        defaultValue: null
                    },
                    status: {
                        type: DataTypes.STRING,
                        defaultValue: 'inactive'
                    }
                });
            }

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
