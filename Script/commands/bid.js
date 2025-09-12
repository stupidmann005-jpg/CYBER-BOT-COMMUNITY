const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "bid",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Place a bid on the current auction item",
    commandCategory: "economy",
    usages: "<amount>",
    cooldowns: 3
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID } = event;
    
    // Check if there's an active auction
    if (!global.globalAuction || !global.globalAuction.isActive) {
        return api.sendMessage(
            "❌ There is no active auction right now.\n\n" +
            "Use '!auction' to start a new auction.",
            threadID, messageID
        );
    }
    
    // Parse bid amount
    const bidAmount = parseInt(args[0]);
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
        return api.sendMessage("❌ Please enter a valid bid amount.", threadID, messageID);
    }
    
    // Check if auction is still active
    if (new Date() > global.globalAuction.endTime) {
        return api.sendMessage("❌ This auction has already ended.", threadID, messageID);
    }
    
    // Check if bid is higher than current highest bid
    if (bidAmount <= global.globalAuction.highestBid) {
        return api.sendMessage(
            `❌ Your bid must be higher than the current highest bid of $${global.globalAuction.highestBid}.`,
            threadID, messageID
        );
    }
    
    // Check if user has enough money
    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;
    
    if (bidAmount > userMoney) {
        return api.sendMessage(
            `❌ You don't have enough money to place this bid. Your balance: $${userMoney}`,
            threadID, messageID
        );
    }
    
    // Get user's name
    const userName = await Users.getNameUser(senderID);
    
    // Update auction state
    global.globalAuction.highestBid = bidAmount;
    global.globalAuction.highestBidder = senderID;
    global.globalAuction.bids.push({
        bidderID: senderID,
        amount: bidAmount,
        timestamp: new Date()
    });
    
    // Extend auction time if bid is placed in last 30 seconds
    const timeLeft = global.globalAuction.endTime - new Date();
    if (timeLeft < 30000) { // less than 30 seconds
        global.globalAuction.endTime = new Date(Date.now() + 30000); // extend by 30 seconds
        
        // Reset the timeout
        clearTimeout(global.auctionTimeout);
        global.auctionTimeout = setTimeout(() => {
            // Import the auction module to call endAuction
            const auctionModule = require('./auction');
            if (typeof auctionModule.endAuction === 'function') {
                auctionModule.endAuction(api, threadID);
            }
        }, 30000);
    }
    
    // Deduct money from user's wallet (will be finalized when auction ends)
    // This is just a reservation, money will be deducted only if the user wins
    
    // Notify about the bid
    return api.sendMessage(
        `✅ ${userName} has placed a bid of $${bidAmount}!\n\n` +
        `This is now the highest bid for ${global.globalAuction.currentItem.name}.`,
        threadID, messageID
    );
};