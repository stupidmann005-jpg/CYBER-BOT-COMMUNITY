const fs = require('fs-extra');
const path = require('path');
const { AuctionItems } = require("../../includes/database/models/auction");

module.exports = {
    config: {
        name: "auctionqueue",
        version: "1.0.0",
        hasPermssion: 0,
        credits: "CyberBot",
        description: "View all pending items in the auction queue",
        commandCategory: "auction",
        usages: "auctionqueue",
        cooldowns: 5
    },
    onStart: async function() {
        // This is intentionally empty to prevent initialization message
    },
    run: async function({ api, event }) {
        try {
            // Get all pending items
            const pendingItems = await AuctionItems.findAll({
                where: {
                    status: 'pending',
                    enabled: true
                },
                order: [['createdAt', 'ASC']]
            });

            if (pendingItems.length === 0) {
                return api.sendMessage("📦 No items are pending for auction.", event.threadID);
            }

            // Create a nicely formatted list
            let message = "📋 Auction Queue:\n\n";
            
            for (let i = 0; i < pendingItems.length; i++) {
                const item = pendingItems[i];
                message += `${i + 1}. ${item.name}\n`;
                message += `   💰 Minimum Bid: $${item.minimumBid}\n`;
                message += `   📝 Description: ${item.description}\n`;
                message += `   🆔 Item ID: ${item.id}\n`;
                if (i < pendingItems.length - 1) message += "\n";
            }

            message += "\nℹ️ These items will be auctioned automatically in order.";

            // Send the text first
            api.sendMessage(message, event.threadID, async (err, info) => {
                if (err) return console.error(err);

                // Then send images of the first 5 items
                const maxImagesToShow = Math.min(5, pendingItems.length);
                for (let i = 0; i < maxImagesToShow; i++) {
                    const item = pendingItems[i];
                    const imagePath = path.join(__dirname, '..', '..', 'includes', 'cache', item.imageURL);
                    
                    if (await fs.exists(imagePath)) {
                        await api.sendMessage(
                            {
                                body: `Item ${i + 1}: ${item.name}`,
                                attachment: fs.createReadStream(imagePath)
                            },
                            event.threadID
                        );
                        // Add a small delay between messages
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                // If there are more items, let them know
                if (pendingItems.length > 5) {
                    api.sendMessage(
                        `... and ${pendingItems.length - 5} more items in queue.`,
                        event.threadID
                    );
                }
            });

        } catch (error) {
            console.error("Error in auctionqueue command:", error);
            return api.sendMessage("❌ An error occurred while getting pending items.", event.threadID);
        }
    }
};
