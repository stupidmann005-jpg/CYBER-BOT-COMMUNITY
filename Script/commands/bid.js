const fs = require('fs-extra');
const path = require('path');
const { sequelize } = require('../../includes/database');
const { AuctionItems, AuctionBids, EnabledThreads } = require('../../includes/database/models/auctionModels');

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
                threadID, messageID
            );
        }

        // Find active auction from database
        const activeAuction = await AuctionItems.findOne({
            where: { status: 'active' }
        });

        if (!activeAuction) {
            return api.sendMessage(
                "There is no active auction right now. Use '/auction' to check when the next auction will start.",
                threadID, messageID
            );
        }
    
        // Get and validate bid amount
        const bidAmount = parseInt(args[0]);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            return api.sendMessage(
                "Please enter a valid bid amount. Example: '/bid 1000'",
                threadID, messageID
            );
        }

        // Calculate minimum allowed bid
        const currentBid = activeAuction.currentBid || activeAuction.minimumBid;
        const minIncrement = Math.ceil(currentBid * 0.1); // 10% minimum increase
        const minNextBid = currentBid + minIncrement;

        if (bidAmount < minNextBid) {
            return api.sendMessage(
                `Your bid must be at least $${minNextBid} (current bid: $${currentBid}, min increase: $${minIncrement}).`,
                threadID, messageID
            );
        }

        // Check if auction is still active
        const now = new Date();
        if (now >= activeAuction.auctionEndTime) {
            return api.sendMessage(
                "This auction has already ended. Please wait for the next auction.",
                threadID, messageID
            );
        }

        // Prevent self-bidding
        if (activeAuction.currentBidder === senderID) {
            return api.sendMessage(
                "You already have the highest bid in this auction!",
                threadID, messageID
            );
        }
    
        // Start transaction for bid handling
        const transaction = await sequelize.transaction();

        try {
            // Lock and check user's balance
            const userMoney = await Currencies.findOne({
                where: { userID: senderID },
                lock: true,
                transaction
            });

            const userBalance = userMoney?.money || 0;
            if (userBalance < bidAmount) {
                await transaction.rollback();
                return api.sendMessage(
                    `You don't have enough money to place this bid. Your balance: $${userBalance}`,
                    threadID, messageID
                );
            }

            // Get user's name
            const userData = await Users.getData(senderID);
            const userName = userData?.name || "Unknown User";

            // If there was a previous bid, return that person's money
            if (activeAuction.currentBidder) {
                await Currencies.increment(
                    'money',
                    {
                        by: activeAuction.currentBid,
                        where: { userID: activeAuction.currentBidder },
                        transaction
                    }
                );
            }

            // Hold the new bid amount
            await Currencies.decrement(
                'money',
                {
                    by: bidAmount,
                    where: { userID: senderID },
                    transaction
                }
            );

            // Update auction state
            await activeAuction.update({
                currentBid: bidAmount,
                currentBidder: senderID
            }, { transaction });

            // Record the bid
            await AuctionBids.create({
                itemId: activeAuction.id,
                bidderID: senderID,
                amount: bidAmount
            }, { transaction });

            // Extend auction time if bid is placed near the end
            const timeLeft = activeAuction.auctionEndTime - now;
            if (timeLeft < 120000) { // Less than 2 minutes left
                const newEndTime = new Date(now.getTime() + 120000); // Add 2 minutes
                await activeAuction.update({
                    auctionEndTime: newEndTime
                }, { transaction });
            }

            await transaction.commit();

            // Calculate time remaining for message
            const timeLeftMs = activeAuction.auctionEndTime - now;
            const minutesLeft = Math.floor(timeLeftMs / 60000);
            const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
        
            // Announce the new bid
            let msg = `🎉 NEW HIGHEST BID! 🎉\n\n` +
                     `Item: ${activeAuction.name}\n` +
                     `New Highest Bid: $${bidAmount}\n` +
                     `Bidder: ${userName}\n` +
                     `Time Remaining: ${minutesLeft}m ${secondsLeft}s`;

            // Add extension notice if time was extended
            if (timeLeft < 120000) {
                msg += `\n\n⏰ Auction extended by 2 minutes due to last-minute bid!`;
            }

            await api.sendMessage(msg, threadID, messageID);

        } catch (error) {
            // Rollback transaction on error
            await transaction.rollback();
            console.error('Error processing bid:', error);
            return api.sendMessage(
                "❌ There was an error processing your bid. Your money has not been deducted.",
                threadID, messageID
            );
        }
    } catch (error) {
        console.error('Error in bid command:', error);
        return api.sendMessage(
            "❌ An error occurred while processing your bid. Please try again.",
            threadID, messageID
        );
    }
};
