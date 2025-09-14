// Auction Scheduler for CYBER-BOT
const { AuctionItems, AuctionBids, AuctionQueue, EnabledThreads } = require('./database/models/auctionModels');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs-extra');

let auctionInterval = null;
let auctionTimeout = null;

// Get list of threads where auctions are enabled
async function getEnabledThreads() {
    const configPath = path.join(__dirname, 'cache', 'auction_threads.json');
    try {
        if (fs.existsSync(configPath)) {
            return await fs.readJson(configPath);
        }
    } catch (error) {
        console.error('Error reading enabled threads:', error);
    }
    return [];
}

// Default auction settings
const DEFAULT_SETTINGS = {
    auctionDurationMinutes: 10,
    minimumAuctionDuration: 5,
    maximumAuctionDuration: 60,
    extendTimeOnBidMinutes: 2
};

async function getAuctionSettings() {
    const configPath = path.join(__dirname, 'cache', 'auction_config.json');
    try {
        if (fs.existsSync(configPath)) {
            const config = await fs.readJson(configPath);
            return {
                auctionDurationMinutes: config.auctionDurationMinutes || DEFAULT_SETTINGS.auctionDurationMinutes,
                minimumAuctionDuration: config.minimumAuctionDuration || DEFAULT_SETTINGS.minimumAuctionDuration,
                maximumAuctionDuration: config.maximumAuctionDuration || DEFAULT_SETTINGS.maximumAuctionDuration,
                extendTimeOnBidMinutes: config.extendTimeOnBidMinutes || DEFAULT_SETTINGS.extendTimeOnBidMinutes
            };
        }
    } catch (error) {
        console.error('Error reading auction config:', error);
    }
    return DEFAULT_SETTINGS;
}

async function startAuction() {
    // Load auction queue
    const queuePath = require('path').join(__dirname, 'cache', 'auction_queue.json');
    if (!require('fs-extra').existsSync(queuePath)) return;
    
    const queue = await require('fs-extra').readJson(queuePath);
    if (!queue.length) return;

    // Get next item from queue
    const nextItemId = queue.shift();
    await require('fs-extra').writeJson(queuePath, queue, { spaces: 2 });

    // Get item details
    const item = await AuctionItems.findByPk(nextItemId);
    if (!item) return;

    // Get auction duration and create auction entry
    const durationMinutes = await getAuctionDuration();
    const auction = await Auctions.create({
        currentItemId: item.id,
        currentAuctionStart: new Date(),
        currentAuctionEnd: new Date(Date.now() + durationMinutes * 60 * 1000),
        status: 'active',
    });

    // Send auction announcement to enabled chats
    const enabledThreads = await getEnabledThreads();
    const auctionMessage = `🔨 NEW AUCTION STARTED!\n\n` +
                          `Item: ${item.name}\n` +
                          `Description: ${item.description}\n` +
                          `Minimum Bid: $${item.minimumBid}\n` +
                          `Duration: ${durationMinutes} minutes\n\n` +
                          `Use 'bid <amount>' to place a bid!`;

    for (const threadID of enabledThreads) {
        try {
            if (item.imageURL) {
                api.sendMessage(
                    { body: auctionMessage, attachment: await global.utils.getStreamFromURL(item.imageURL) },
                    threadID
                );
            } else {
                api.sendMessage(auctionMessage, threadID);
            }
        } catch (error) {
            console.error(`Error sending auction message to thread ${threadID}:`, error);
        }
    }

    // Schedule auction end
    auctionTimeout = setTimeout(() => endAuction(auction.id), durationMinutes * 60 * 1000);
}

async function endAuction(auctionId) {
    const auction = await Auctions.findByPk(auctionId);
    if (!auction || auction.status !== 'active') return;

    // Find highest bid
    const highestBid = await AuctionBids.findOne({
        where: { auctionId },
        order: [['amount', 'DESC']],
    });

    if (highestBid) {
        try {
            // Start transaction
            await sequelize.transaction(async (t) => {
                // Get the item and previous owner
                const item = await AuctionItems.findByPk(auction.currentItemId, { transaction: t });
                const previousOwnerID = item.ownerID;
                
                // Transfer item ownership
                item.ownerID = highestBid.bidderID;
                await item.save({ transaction: t });
                
                // Update auction status
                auction.highestBidAmount = highestBid.amount;
                auction.highestBidderID = highestBid.bidderID;
                auction.status = 'ended';
                await auction.save({ transaction: t });
                
                // Handle payments
                if (previousOwnerID) {
                    // Pay the previous owner
                    await Users.increment('money', {
                        by: highestBid.amount,
                        where: { id: previousOwnerID },
                        transaction: t
                    });
                }
                
                // Deduct money from winner (they should have already had it held when bidding)
                await Users.decrement('money', {
                    by: highestBid.amount,
                    where: { id: highestBid.bidderID },
                    transaction: t
                });
                
                // Create transaction record
                await AuctionTransactions.create({
                    itemId: item.id,
                    sellerId: previousOwnerID,
                    buyerId: highestBid.bidderID,
                    amount: highestBid.amount,
                    type: 'auction_sale'
                }, { transaction: t });
            });
            
            // Send success notifications
            const winner = await Users.findByPk(highestBid.bidderID);
            const winnerMsg = `🎉 Congratulations! You won the auction!\n` +
                            `Item: ${item.name}\n` +
                            `Final Price: $${highestBid.amount}`;
            await api.sendMessage(winnerMsg, winner.threadID);
            
            if (previousOwnerID) {
                const seller = await Users.findByPk(previousOwnerID);
                const sellerMsg = `💰 Your item "${item.name}" has been sold!\n` +
                                `Sale Price: $${highestBid.amount}`;
                await api.sendMessage(sellerMsg, seller.threadID);
            }
        } catch (error) {
            console.error('Error processing auction end:', error);
            // Handle failed transaction
            auction.status = 'error';
            await auction.save();
        }
    } else {
        auction.status = 'ended';
        await auction.save();
        // Notify no winner
    }
}

async function startScheduler() {
    if (auctionInterval) return;
    const durationMinutes = await getAuctionDuration();
    auctionInterval = setInterval(startAuction, durationMinutes * 60 * 1000);
    startAuction(); // Start immediately
}

function stopScheduler() {
    if (auctionInterval) clearInterval(auctionInterval);
    if (auctionTimeout) clearTimeout(auctionTimeout);
}

module.exports = { startScheduler, stopScheduler };

