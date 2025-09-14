const { AuctionItems, AuctionBids, EnabledThreads } = require('../../includes/database/models');

module.exports.config = {
    name: "bid",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Place a bid in the current auction",
    commandCategory: "economy",
    usages: "[amount]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    
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

        // Check if there's an active auction
        const activeAuction = await AuctionItems.findOne({
            where: { status: 'active' }
        });

        if (!activeAuction) {
            return api.sendMessage(
                "❌ There is no active auction right now.\n" +
                "Use '/auction' to check when the next auction will start.",
                threadID
            );
        }

        // Get bid amount from args
        const bidAmount = parseInt(args[0]);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            return api.sendMessage(
                "❌ Please provide a valid bid amount.\n" +
                "Usage: /bid <amount>",
                threadID
            );
        }

        // Check if bid meets minimum amount
        if (bidAmount < activeAuction.minimumBid) {
            return api.sendMessage(
                `❌ Your bid must be at least $${activeAuction.minimumBid}`,
                threadID
            );
        }

        // Check if bid is higher than current bid
        if (bidAmount <= (activeAuction.currentBid || activeAuction.minimumBid)) {
            return api.sendMessage(
                `❌ Your bid must be higher than the current bid of $${activeAuction.currentBid || activeAuction.minimumBid}`,
                threadID
            );
        }

        // Check user's balance
        const userBalance = await Currencies.getData(senderID);
        if (!userBalance || userBalance.money < bidAmount) {
            return api.sendMessage(
                "❌ You don't have enough money to place this bid!",
                threadID
            );
        }

        // Place the bid
        await AuctionBids.create({
            auctionId: activeAuction.id,
            itemId: activeAuction.id,
            bidderID: senderID,
            amount: bidAmount
        });

        // Update item's current bid
        await activeAuction.update({
            currentBid: bidAmount,
            currentBidderID: senderID
        });

        // Get bidder's name
        const bidderName = await Users.getNameUser(senderID);

        // Announce the new bid
        return api.sendMessage(
                "❌ Please enter a valid bid amount.\n" +
                "Example: /bid 1000",
                threadID
            );
        }

        // Check if bid is higher than current highest bid or minimum bid
        const minimumBid = activeAuction.currentBid > 0 ? 
            activeAuction.currentBid + 50 : // Minimum increment of 50
            activeAuction.minimumBid;

        if (bidAmount < minimumBid) {
            return api.sendMessage(
                `❌ Your bid must be at least $${minimumBid}\n` +
                `${activeAuction.currentBid > 0 ? '(current bid + $50)' : '(minimum bid)'}`,
                threadID
            );
        }

        // Check if user has enough money
        const userBalance = await Currencies.getData(senderID);
        if (userBalance.money < bidAmount) {
            return api.sendMessage(
                `❌ You don't have enough money to place this bid!\n` +
                `Your balance: $${userBalance.money}\n` +
                `Required: $${bidAmount}`,
                threadID
            );
        }

        // Check if auction hasn't ended
        if (activeAuction.auctionEndTime && new Date() > new Date(activeAuction.auctionEndTime)) {
            return api.sendMessage(
                "❌ This auction has already ended!",
                threadID
            );
        }

        // Record the bid
        await AuctionBids.create({
            itemId: activeAuction.id,
            bidderID: senderID,
            amount: bidAmount
        });

        // Update auction with new highest bid
        await activeAuction.update({
            currentBid: bidAmount,
            currentBidder: senderID
        });

        // Get bidder's name
        const bidderName = await Users.getNameUser(senderID);

        // Calculate time remaining
        const timeLeft = new Date(activeAuction.auctionEndTime) - new Date();
        const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));
        const secondsLeft = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

        // Announce new highest bid
        api.sendMessage(
            `🔨 New Highest Bid! 🔨\n\n` +
            `Item: ${activeAuction.name}\n` +
            `Bidder: ${bidderName}\n` +
            `Amount: $${bidAmount}\n` +
            `Time Remaining: ${minutesLeft}m ${secondsLeft}s`,
            threadID
        );

    } catch (error) {
        console.error("Error in bid command:", error);
        return api.sendMessage("❌ An error occurred while processing your bid.", threadID);
    }
};
