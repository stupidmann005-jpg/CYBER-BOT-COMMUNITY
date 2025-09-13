const { AuctionItems, EnabledThreads } = require('../../includes/database/models');

module.exports = {
    config: {
        name: 'auction',
        description: 'Show current auction item',
        usage: 'auction',
        cooldown: 5,
    },
    run: async function({ api, event, Users }) {
        const { threadID } = event;

        try {
            // Check if auctions are enabled for this thread
            const threadEnabled = await EnabledThreads.findOne({
                where: { 
                    threadID: threadID,
                    enabled: true
                }
            });

            if (!threadEnabled) {
                return api.sendMessage(
                    "❌ Auctions are not enabled in this group.\n" +
                    "An admin must use '/enableauction' first.",
                    threadID
                );
            }

            // Find active auction
            const activeItem = await AuctionItems.findOne({ 
                where: { status: 'active' }
            });

            if (!activeItem) {
                return api.sendMessage(
                    "📢 No auction is currently running.\n" +
                    "Use '/additem' to add items to the auction queue.",
                    threadID
                );
            }

            // Calculate time remaining
            const timeLeft = activeItem.auctionEndTime - new Date();
            const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));
            const secondsLeft = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

            let msg = `� Current Auction 🔨\n\n`;
            msg += `Item: ${activeItem.name}\n`;
            msg += `Description: ${activeItem.description}\n`;
            msg += `Current Bid: $${activeItem.currentBid || activeItem.minimumBid}\n`;
            if (activeItem.currentBidder) {
                const bidderName = await Users.getNameUser(activeItem.currentBidder);
                msg += `Highest Bidder: ${bidderName}\n`;
            }
            msg += `Minimum Next Bid: $${(activeItem.currentBid || activeItem.minimumBid) + 50}\n`;
            msg += `Time Remaining: ${minutesLeft}m ${secondsLeft}s\n\n`;
            msg += `Use '/bid <amount>' to place a bid!`;

            if (activeItem.imageURL) {
                // Send image with details
                api.sendMessage({ 
                    body: msg, 
                    attachment: await global.utils.getStreamFromURL(activeItem.imageURL) 
                }, threadID);
            } else {
                api.sendMessage(msg, threadID);
            }
        } catch (error) {
            console.error('Error in auction command:', error);
            return api.sendMessage('❌ An error occurred while checking the auction.', threadID);
        }
    }
};
