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

const { AuctionError, AuctionManager } = require('../../includes/utils/auctionManager');

module.exports.run = async function({ api, event, args, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const auctionManager = new AuctionManager(api);
    
    try {
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
    
    // Load auction config
    const configPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_config.json');
    const config = await fs.readJson(configPath);
    
    const currentBid = global.globalAuction.highestBid;
    const minIncrement = config.minBidIncrement || 50;
    const minimumBid = currentBid ? currentBid + minIncrement : global.globalAuction.minimumBid;
    
    // Validate bid amount
    if (bidAmount < minimumBid) {
        return api.sendMessage(
            `Your bid must be at least $${minimumBid} (current bid: $${currentBid || 0}, minimum increment: $${minIncrement}).`,
            threadID, messageID
        );
    }
    
    // Check if the auction is still accepting bids
    const currentTime = Date.now();
    if (currentTime >= global.globalAuction.endTime) {
        throw new AuctionError(
            "This auction has already ended",
            'AUCTION_ENDED',
            { endTime: global.globalAuction.endTime }
        );
    }
    
    // Prevent self-bidding if user is current highest bidder
    if (global.globalAuction.highestBidder === senderID) {
        return api.sendMessage(
            "You already have the highest bid in this auction!",
            threadID, messageID
        );
    }
    
    try {
        // Start a transaction for bid placement
        const transaction = await sequelize.transaction();
        
        try {
            // Check if the user has enough money
            const userMoney = await Currencies.findOne({
                where: { userID: senderID },
                lock: true,
                transaction
            });
            
            const userBalance = userMoney ? userMoney.money : 0;
            if (userBalance < bidAmount) {
                await transaction.rollback();
                return api.sendMessage(
                    `You don't have enough money to place this bid. Your balance: $${userBalance}`,
                    threadID, messageID
                );
            }

            // Hold the bid amount
            await Currencies.update(
                { money: userBalance - bidAmount },
                { 
                    where: { userID: senderID },
                    transaction
                }
            );

            // Record the held amount
            await AuctionHolds.create({
                userID: senderID,
                amount: bidAmount,
                auctionID: global.globalAuction.id,
                expiresAt: global.globalAuction.endTime
            }, { transaction });

            // If there was a previous bid, return that person's money
            if (global.globalAuction.highestBidder) {
                const previousBid = global.globalAuction.highestBid;
                await Currencies.increment(
                    'money',
                    {
                        by: previousBid,
                        where: { userID: global.globalAuction.highestBidder },
                        transaction
                    }
                );
                
                // Delete the previous hold
                await AuctionHolds.destroy({
                    where: {
                        userID: global.globalAuction.highestBidder,
                        auctionID: global.globalAuction.id
                    },
                    transaction
                });
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw new AuctionError('Failed to process bid transaction', 'TRANSACTION_FAILED', {
                bidAmount,
                userId: senderID
            });
        }
    } catch (error) {
        await auctionManager.handleError(error, threadID, {
            command: 'bid',
            userId: senderID,
            bidAmount
        });
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

        // Extend auction time if bid is placed near the end
        const settings = await getAuctionSettings();
        const timeLeft = global.globalAuction.endTime - new Date();
        if (timeLeft < settings.extendTimeOnBidMinutes * 60 * 1000) {
            const newEndTime = new Date(Date.now() + settings.extendTimeOnBidMinutes * 60 * 1000);
            if (newEndTime - global.globalAuction.startTime <= settings.maximumAuctionDuration * 60 * 1000) {
                global.globalAuction.endTime = newEndTime;
                await api.sendMessage(
                    `⏰ Auction extended by ${settings.extendTimeOnBidMinutes} minutes due to last-minute bid!`,
                    threadID
                );
            }
        }
        
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
