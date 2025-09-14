// Auction Scheduler for CYBER-BOT
const { Auctions, AuctionItems, AuctionBids, Users } = require('../includes/database/models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs-extra');

let auctionInterval = null;
let auctionTimeout = null;

// Get list of threads where auctions are enabled
async function getEnabledThreads() {
    try {
        const enabledThreads = await EnabledThreads.findAll({
            where: { enabled: true },
            attributes: ['threadID']
        });
        return enabledThreads.map(thread => thread.threadID);
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
    try {
        // Get next item from queue
        const nextItem = await AuctionItems.findOne({
            where: {
                status: 'queued'
            },
            order: [['createdAt', 'ASC']]
        });

        if (!nextItem) return;

        // Update item status to active
        await nextItem.update({ status: 'active' });

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

async function endAuction(itemId) {
    const item = await AuctionItems.findOne({
        where: {
            id: itemId,
            status: 'active'
        }
    });

    if (!item) return;

    // Find highest bid
    const highestBid = await AuctionBids.findOne({
        where: { itemId: item.id },
        order: [['amount', 'DESC']]
    });

    // Get enabled threads to notify
    const enabledThreads = await EnabledThreads.findAll({
        where: { enabled: true }
    });

    if (highestBid) {
        // Update item status and ownership
        await item.update({
            status: 'ended',
            ownerID: highestBid.bidderID
        });

        // Deduct money from winner
        await Currencies.decreaseMoney(highestBid.bidderID, highestBid.amount);

        // Get winner's name
        const winnerName = await Users.getNameUser(highestBid.bidderID);

        // Notify all enabled threads
        const endMessage = `🔨 AUCTION ENDED!\n\n` +
                         `Item: ${item.name}\n` +
                         `Winner: ${winnerName}\n` +
                         `Winning Bid: $${highestBid.amount}`;

        for (const thread of enabledThreads) {
            api.sendMessage(endMessage, thread.threadID);
        }
    } else {
        // No bids - end auction
        await item.update({ status: 'ended' });

        // Notify all enabled threads
        const endMessage = `🔨 AUCTION ENDED!\n\n` +
                         `Item: ${item.name}\n` +
                         `No bids were placed.`;

        for (const thread of enabledThreads) {
            api.sendMessage(endMessage, thread.threadID);
        }
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
