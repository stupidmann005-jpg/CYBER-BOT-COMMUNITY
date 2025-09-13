const fs = require('fs-extra');
const path = require('path');
const { sequelize } = require("../../includes/database/index");

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
            // First check if database is connected
            try {
                await sequelize.authenticate();
                console.log('Database connection has been established successfully.');
            } catch (error) {
                console.error('Unable to connect to the database:', error);
                return api.sendMessage('❌ Database connection failed: ' + error.message, event.threadID);
            }

            // Load and sync auction models
            try {
                const { DataTypes } = require('sequelize');

                // Define AuctionItems model
                const AuctionItems = sequelize.define('AuctionItems', {
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
                    currentBid: {
                        type: DataTypes.BIGINT,
                        defaultValue: 0
                    },
                    currentBidder: {
                        type: DataTypes.STRING
                    },
                    ownerID: {
                        type: DataTypes.STRING,
                        defaultValue: null
                    },
                    status: {
                        type: DataTypes.STRING,
                        defaultValue: 'pending'
                    },
                    enabled: {
                        type: DataTypes.BOOLEAN,
                        defaultValue: true
                    },
                    auctionStartTime: {
                        type: DataTypes.DATE
                    },
                    auctionEndTime: {
                        type: DataTypes.DATE
                    }
                });

                // Define AuctionBids model
                const AuctionBids = sequelize.define('AuctionBids', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        autoIncrement: true
                    },
                    itemId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    userId: {
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

                // Define AuctionQueue model for persistent queue
                const AuctionQueue = sequelize.define('AuctionQueue', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        autoIncrement: true
                    },
                    itemId: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    position: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                });

                // Define EnabledThreads model for persistent thread settings
                const EnabledThreads = sequelize.define('EnabledThreads', {
                    threadID: {
                        type: DataTypes.STRING,
                        primaryKey: true
                    },
                    enabled: {
                        type: DataTypes.BOOLEAN,
                        defaultValue: true
                    }
                });

                // Set up relationships
                AuctionBids.belongsTo(AuctionItems, { foreignKey: 'itemId' });
                AuctionItems.hasMany(AuctionBids, { foreignKey: 'itemId' });
                AuctionQueue.belongsTo(AuctionItems, { foreignKey: 'itemId' });

                // Sync the models with the database
                await sequelize.sync();
                console.log('Models synced successfully');
            } catch (error) {
                console.error('Error setting up models:', error);
                return api.sendMessage('❌ Failed to set up auction models: ' + error.message, event.threadID);
            }

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
