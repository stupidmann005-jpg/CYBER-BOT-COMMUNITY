const { AuctionItems, AuctionBids } = require('../../includes/database/models');

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
        // Check if there's an active auction
        const activeAuction = await AuctionItems.findOne({
            where: { status: 'active' }
        });

        if (!activeAuction) {
            return api.sendMessage(
                "❌ There is no active auction right now.\nUse '/auction' to check when the next auction will start.",
                threadID
            );
        }

        // Get bid amount from args
        const bidAmount = parseInt(args[0]);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            return api.sendMessage(
                "❌ Please enter a valid bid amount.\nExample: /bid 1000",
                threadID
            );
        }

        // Check if bid is higher than current highest bid or minimum bid
        const minimumBid = activeAuction.currentBid > 0 ? 
            activeAuction.currentBid + 50 : // Minimum increment of 50
            activeAuction.minimumBid;

        if (bidAmount < minimumBid) {
            return api.sendMessage(
                `❌ Your bid must be at least $${minimumBid}${activeAuction.currentBid > 0 ? ' (current bid + $50)' : ''}`,
                threadID
            );
        }

        // Check if user has enough money
        const userBalance = await Currencies.getData(senderID);
        if (userBalance.money < bidAmount) {
            return api.sendMessage(
                "❌ You don't have enough money to place this bid!",
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

        // Announce new highest bid
        api.sendMessage(
            `🔨 New Highest Bid! 🔨\n\n` +
            `Item: ${activeAuction.name}\n` +
            `Bidder: ${bidderName}\n` +
            `Amount: $${bidAmount}`,
            threadID
        );

    } catch (error) {
        console.error("Error in bid command:", error);
        return api.sendMessage("❌ An error occurred while processing your bid.", threadID);
    }
};
    }
    
    // Get the bid amount
    const bidAmount = parseInt(args[0]);
    if (isNaN(bidAmount) || bidAmount <= 0) {
        return api.sendMessage(
            "Please enter a valid bid amount. Example: !bid 1000",
            threadID, messageID
        );
    }
    
    // Check if the bid is higher than the current highest bid
    if (bidAmount <= global.globalAuction.highestBid) {
        return api.sendMessage(
            `Your bid must be higher than the current highest bid of $${global.globalAuction.highestBid}.`,
            threadID, messageID
        );
    }
    
    try {
        // Check if the user has enough money
        const userMoney = await Currencies.getData(senderID);
        const userBalance = userMoney.money || 0;
        
        if (userBalance < bidAmount) {
            return api.sendMessage(
                `You don't have enough money to place this bid. Your balance: $${userBalance}`,
                threadID, messageID
            );
        }
        
        // Get user's name
        const userData = await Users.getData(senderID);
        const userName = userData.name || "Unknown User";
        
        // Update auction state
        global.globalAuction.highestBid = bidAmount;
        global.globalAuction.highestBidder = senderID;
        
        // Record the bid
        global.globalAuction.bids.push({
            userID: senderID,
            userName: userName,
            amount: bidAmount,
            time: new Date()
        });
        
        // Calculate time remaining
        const now = new Date();
        const endTime = new Date(global.globalAuction.endTime);
        const timeLeftMs = endTime - now;
        const minutesLeft = Math.floor(timeLeftMs / 60000);
        const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
        
        // Announce the new bid
        return api.sendMessage(
            `🎉 NEW HIGHEST BID! 🎉\n\n` +
            `Item: ${global.globalAuction.currentItem.name}\n` +
            `New Highest Bid: $${bidAmount}\n` +
            `Bidder: ${userName}\n` +
            `Time Remaining: ${minutesLeft}m ${secondsLeft}s`,
            threadID, messageID
        );
    } catch (error) {
        console.error('Error processing bid:', error);
        return api.sendMessage(
            "There was an error processing your bid. Please try again later.",
            threadID, messageID
        );
    }
};
