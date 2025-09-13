const fs = require('fs-extra');
const path = require('path');
const { sequelize } = require("../../includes/database/index");
const { AuctionItems } = require("../../includes/database/models/auction");

module.exports = {
    config: {
        name: "auctionScheduler",
        version: "1.0.0",
        credits: "CyberBot",
        description: "Auto announces auctions every 2 minutes",
        envConfig: {
            autoUnsend: false,
            delayPerGroup: 500
        }
    },
    interval: null, // Store interval reference
    onLoad: async function ({ api }) {
        // Create auction directory if it doesn't exist
        const auctionDir = path.join(__dirname, "..", "..", "includes", "cache", "auction");
        const configPath = path.join(auctionDir, "auction_config.json");
        const threadsPath = path.join(auctionDir, "auction_threads.json");
        const queuePath = path.join(auctionDir, "auction_queue.json");
        
        // Store these paths globally
        this.auctionDir = auctionDir;
        this.configPath = configPath;
        this.threadsPath = threadsPath;
        this.queuePath = queuePath;

        try {
            await fs.ensureDir(auctionDir);
            
            // Initialize config if it doesn't exist
            if (!await fs.exists(configPath)) {
                await fs.writeJson(configPath, {
                    auctionDurationMinutes: 2,
                    minBidIncrement: 50,
                    enableAutoStart: true
                });
            }

            // Initialize threads list if it doesn't exist
            if (!await fs.exists(threadsPath)) {
                await fs.writeJson(threadsPath, []);
            }

            // Initialize queue if it doesn't exist
            if (!await fs.exists(queuePath)) {
                await fs.writeJson(queuePath, []);
            }

            // Start the auction check interval
            if (this.interval) clearInterval(this.interval);
            
            this.interval = setInterval(async () => {
                try {
                    const config = await fs.readJson(configPath);
                    if (!config.enableAutoStart) return;

                    const threads = await fs.readJson(threadsPath);
                    if (threads.length === 0) return; // No threads to announce to
                    
                    // Force check for new auctions
                    await this.checkAndStartAuctions({ api });
                } catch (error) {
                    console.error("Error in auction scheduler interval:", error);
                }
            }, 30000); // Check every 30 seconds

            console.log("[Auction Scheduler] Initialized and running...");
        } catch (error) {
            console.error("Error initializing auction scheduler:", error);
        }
    },
    
    async checkAndStartAuctions({ api }) {
        try {
            const config = await fs.readJson(this.configPath);
            const threads = await fs.readJson(this.threadsPath);
            let queue = await fs.readJson(this.queuePath);

            if (queue.length === 0) {
                // Find items that haven't been auctioned yet
                const pendingItems = await AuctionItems.findAll({
                    where: {
                        status: 'pending',
                        enabled: true
                    },
                    order: [['createdAt', 'ASC']],
                    limit: 1
                });

                if (pendingItems.length > 0) {
                    const item = pendingItems[0];
                    
                    // Start new auction
                    queue.push({
                        itemId: item.id,
                        startTime: Date.now(),
                        endTime: Date.now() + (config.auctionDurationMinutes * 60 * 1000),
                        currentBid: item.minimumBid,
                        highestBidder: null
                    });

                    await item.update({ status: 'active' });
                    await fs.writeJson(this.queuePath, queue);

                    // Announce in all threads
                    for (const threadID of threads) {
                        try {
                            await api.sendMessage(
                                `🎉 New Auction Started! 🎉\n\n` +
                                `Item: ${item.name}\n` +
                                `Description: ${item.description}\n` +
                                `Starting Bid: $${item.minimumBid}\n` +
                                `Duration: ${config.auctionDurationMinutes} minutes\n\n` +
                                "To bid, use: /bid <amount>",
                                threadID
                            );
                        } catch (err) {
                            console.error(`Error announcing auction in thread ${threadID}:`, err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error checking auctions:", error);
        }
    },
    run: async function ({ api, event, args }) {
        try {
            // This is intentionally empty as this is an auto-event
        } catch (error) {
            console.error("Error in auction scheduler run:", error);
        }
    },
    handleEvent: async function ({ api, event, client }) {
        if (!event.isGroup) return; // Only run in groups

        try {
            const auctionDir = path.join(__dirname, "..", "..", "includes", "cache", "auction");
            const configPath = path.join(auctionDir, "auction_config.json");
            const threadsPath = path.join(auctionDir, "auction_threads.json");
            const queuePath = path.join(auctionDir, "auction_queue.json");

            // Load configurations
            const config = await fs.readJson(configPath);
            if (!config.enableAutoStart) return; // Don't run if auto-start is disabled

            // Load and manage auction queue
            let queue = await fs.readJson(queuePath);
            let threads = await fs.readJson(threadsPath);

            // Get next item to auction if no active auction
            if (queue.length === 0) {
                // Find items that haven't been auctioned yet
                const pendingItems = await AuctionItems.findAll({
                    where: {
                        status: 'pending',
                        enabled: true
                    },
                    order: [['createdAt', 'ASC']],
                    limit: 1
                });

                if (pendingItems.length > 0) {
                    const item = pendingItems[0];
                    queue.push({
                        itemId: item.id,
                        startTime: Date.now(),
                        endTime: Date.now() + (config.auctionDurationMinutes * 60 * 1000),
                        currentBid: item.minimumBid,
                        highestBidder: null
                    });

                    // Update item status
                    await item.update({ status: 'active' });
                    await fs.writeJson(queuePath, queue);

                    // Announce auction start in all threads
                    for (const threadID of threads) {
                        try {
                            const imagePath = path.join(auctionDir, "images", path.basename(item.imageURL));
                            
                            // Send auction announcement
                            await api.sendMessage(
                                {
                                    body: "🎉 New Auction Started! 🎉\n\n" +
                                          `Item: ${item.name}\n` +
                                          `Description: ${item.description}\n` +
                                          `Starting Bid: $${item.minimumBid}\n` +
                                          `Duration: ${config.auctionDurationMinutes} minutes\n\n` +
                                          "To bid, use: /bid <amount>",
                                    attachment: fs.createReadStream(imagePath)
                                },
                                threadID
                            );
                            
                            // Add delay between messages to prevent spam
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (err) {
                            console.error(`Error sending to thread ${threadID}:`, err);
                        }
                    }
                }
            } else {
                // Check if current auction should end
                const currentAuction = queue[0];
                if (Date.now() >= currentAuction.endTime) {
                    // Get the item
                    const item = await AuctionItems.findByPk(currentAuction.itemId);
                    
                    // Announce auction end in all threads
                    for (const threadID of threads) {
                        try {
                            const message = currentAuction.highestBidder 
                                ? `🔨 Auction Ended! 🔨\n\n` +
                                  `Item: ${item.name}\n` +
                                  `Winning Bid: $${currentAuction.currentBid}\n` +
                                  `Winner: ${currentAuction.highestBidder}`
                                : `🔨 Auction Ended! 🔨\n\n` +
                                  `Item: ${item.name}\n` +
                                  `No bids were placed.`;
                            
                            await api.sendMessage(message, threadID);
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (err) {
                            console.error(`Error sending to thread ${threadID}:`, err);
                        }
                    }

                    // Update item status and owner
                    if (currentAuction.highestBidder) {
                        await item.update({
                            status: 'sold',
                            ownerID: currentAuction.highestBidder,
                            soldPrice: currentAuction.currentBid
                        });
                    } else {
                        await item.update({ status: 'pending' });
                    }

                    // Remove from queue
                    queue.shift();
                    await fs.writeJson(queuePath, queue);
                }
            }
        } catch (error) {
            console.error("Error in auction scheduler event:", error);
        }
    }
};
