const { AuctionItems } = require('../../includes/database/models/auctionModels');

module.exports = {
    config: {
        name: 'auction',
        description: 'Show current auction item',
        usage: 'auction',
        cooldown: 5,
        hasPermssion: 0, // Everyone can use this command
    },
    run: async function({ api, event, Users }) {
        const { threadID } = event;

        try {
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

            let msg = `🔨 Current Auction 🔨\n\n`;
            msg += `Item: ${activeItem.name}\n`;
            msg += `Description: ${activeItem.description}\n`;
            msg += `Current Bid: $${activeItem.currentBid || activeItem.minimumBid}\n`;
            
            // Safely get bidder name
            if (activeItem.currentBidder) {
                try {
                    const bidderName = await Users.getNameUser(activeItem.currentBidder) || "Unknown User";
                    msg += `Highest Bidder: ${bidderName}\n`;
                } catch (error) {
                    console.error('Error getting bidder name:', error);
                    msg += `Highest Bidder: User_${activeItem.currentBidder}\n`;
                }
            }
            
            const minNextBid = Math.ceil((activeItem.currentBid || activeItem.minimumBid) * 1.1); // 10% minimum increase
            msg += `Minimum Next Bid: $${minNextBid}\n`;
            msg += `Time Remaining: ${minutesLeft}m ${secondsLeft}s\n\n`;
            msg += `Use '/bid <amount>' to place a bid!`;

            try {
                if (activeItem.imageURL) {
                    // Try to load and send image with details
                    try {
                        const attachment = await global.utils.getStreamFromURL(activeItem.imageURL);
                        await api.sendMessage({ 
                            body: msg, 
                            attachment: attachment
                        }, threadID);
                    } catch (imageError) {
                        console.error('Error loading auction image:', imageError);
                        // If image fails, send message without it
                        msg += '\n\n⚠️ (Image unavailable)';
                        await api.sendMessage(msg, threadID);
                    }
                } else {
                    await api.sendMessage(msg, threadID);
                }
            } catch (sendError) {
                console.error('Error sending auction message:', sendError);
                // Simplified fallback message
                await api.sendMessage(
                    `🔨 Auction: ${activeItem.name}\n` +
                    `Current Bid: $${activeItem.currentBid || activeItem.minimumBid}\n` +
                    `Time Left: ${minutesLeft}m ${secondsLeft}s`,
                    threadID
                );
            }
        } catch (error) {
            console.error('Error in auction command:', error);
            return api.sendMessage('❌ An error occurred while checking the auction.', threadID);
        }
    }
};
