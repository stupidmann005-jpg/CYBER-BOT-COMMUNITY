// Auction Scheduler for CYBER-BOT
const { Auctions, AuctionItems, AuctionBids, Users } = require('../includes/database/models');
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

// Default auction duration in minutes
const DEFAULT_AUCTION_DURATION = 2;

async function getAuctionDuration() {
    const configPath = path.join(__dirname, 'cache', 'auction_config.json');
    try {
        if (fs.existsSync(configPath)) {
            const config = await fs.readJson(configPath);
            return config.auctionDurationMinutes || DEFAULT_AUCTION_DURATION;
        }
    } catch (error) {
        console.error('Error reading auction config:', error);
    }
    return DEFAULT_AUCTION_DURATION;
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
        // Transfer item ownership
        const item = await AuctionItems.findByPk(auction.currentItemId);
        item.ownerID = highestBid.bidderID;
        await item.save();
        auction.highestBidAmount = highestBid.amount;
        auction.highestBidderID = highestBid.bidderID;
        auction.status = 'ended';
        await auction.save();
        // Deduct money from winner's wallet (implement wallet logic)
        // Notify winner
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

