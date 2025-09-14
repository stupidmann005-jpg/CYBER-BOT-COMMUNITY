const { AuctionItems } = require('../../includes/database/models/auctionModels');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "viewauction",
        version: "1.0.0",
        hasPermssion: 0,
        credits: "CyberBot",
        description: "View current auction status",
        commandCategory: "economy",
        usages: "",
        cooldowns: 5
    },
    run: async function({ api, event, Users }) {
        const { threadID } = event;

        try {
            // Ensure models are synchronized
            await AuctionItems.sync();
            // Just find active auction
            const activeItem = await AuctionItems.findOne({
                where: { status: 'active' }
            });

            if (!activeItem) {
                return api.sendMessage(
                    "📢 [AUCTION STATUS]\n\n" +
                    "❌ No active auction is currently running.\n\n" +
                    "Available Commands:\n" +
                    "• /viewauction - View current auction\n" +
                    "• /bid <amount> - Place a bid\n\n" +
                    "Admin Commands:\n" +
                    "• /additem2 - Add item to auction\n" +
                    "• /enableauction - Enable auctions\n" +
                    "• /disableauction - Disable auctions",
                    threadID
                );
            }

            // Calculate time remaining
            const timeLeft = activeItem.auctionEndTime - new Date();
            const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));
            const secondsLeft = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

            let msg = `🔨 CURRENT AUCTION 🔨\n\n`;
            msg += `📦 Item: ${activeItem.name}\n`;
            msg += `📝 Description: ${activeItem.description}\n`;
            msg += `💰 Current Bid: $${activeItem.currentBid || activeItem.minimumBid}\n`;

            // Get highest bidder name if exists
            if (activeItem.currentBidder) {
                try {
                    const bidderName = await Users.getNameUser(activeItem.currentBidder);
                    msg += `👑 Highest Bidder: ${bidderName || 'Unknown'}\n`;
                } catch (error) {
                    console.error('Error getting bidder name:', error);
                    msg += `👑 Highest Bidder: ID.${activeItem.currentBidder}\n`;
                }
            }

            // Calculate next minimum bid (10% increase)
            const minNextBid = Math.ceil((activeItem.currentBid || activeItem.minimumBid) * 1.1);
            msg += `📈 Minimum Next Bid: $${minNextBid}\n`;
            msg += `⏰ Time Left: ${minutesLeft}m ${secondsLeft}s\n\n`;
            msg += `💡 Use /bid <amount> to place a bid!`;

            // Try to send with image
            try {
                if (activeItem.imageURL) {
                    const attachment = await global.utils.getStreamFromURL(activeItem.imageURL);
                    return api.sendMessage({ 
                        body: msg,
                        attachment: attachment
                    }, threadID);
                }
            } catch (imageError) {
                console.error('Error loading auction image:', imageError);
            }

            // Fallback to text-only if image fails or doesn't exist
            return api.sendMessage(msg, threadID);

        } catch (error) {
            console.error('Error in viewauction command:', error);
            return api.sendMessage(
                '❌ Failed to check auction status. Please try again.',
                threadID
            );
        }
    }
};
