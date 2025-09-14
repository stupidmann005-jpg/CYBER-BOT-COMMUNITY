const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "bid",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Place a bid in the current auction",
    commandCategory: "economy",
    usages: "[amount]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.run = async function({ api, event, args, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    
    console.log('Bid command executed');
    
    // Check if there's an active auction
    if (!global.globalAuction || !global.globalAuction.isActive) {
        return api.sendMessage(
            "There is no active auction right now. Use '!auction' to check when the next auction will start.",
            threadID, messageID
        );
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
