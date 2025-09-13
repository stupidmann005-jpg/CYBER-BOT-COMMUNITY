const fs = require('fs-extra');
const path = require('path');
const { AuctionItems } = require("../../includes/database/models/auction");

module.exports = {
    config: {
        name: "queue",
        version: "1.0.0",
        hasPermssion: 0,
        credits: "CyberBot",
        description: "View all pending items in the auction queue",
        commandCategory: "auction",
        usages: "queue",
        cooldowns: 5
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

            // Send the text message
            api.sendMessage(message, event.threadID);

        } catch (error) {
            console.error("Error in queue command:", error);
            return api.sendMessage("❌ An error occurred while getting pending items.", event.threadID);
        }
    }
};