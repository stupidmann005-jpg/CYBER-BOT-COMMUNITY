// Auction Scheduler for CYBER-BOT
const { Auctions, AuctionItems, AuctionBids, Users } = require('../includes/database/models');
const { Op } = require('sequelize');

let auctionInterval = null;
let auctionTimeout = null;

async function startAuction() {
    // Select a random item that is not owned
    const item = await AuctionItems.findOne({ where: { ownerID: null } });
    if (!item) return;

    // Create auction entry
    const auction = await Auctions.create({
        currentItemId: item.id,
        currentAuctionStart: new Date(),
        currentAuctionEnd: new Date(Date.now() + 2 * 60 * 1000),
        status: 'active',
    });

    // Notify users (implement bot message logic here)
    // sendAuctionMessage(item);

    // Schedule auction end
    auctionTimeout = setTimeout(() => endAuction(auction.id), 2 * 60 * 1000);
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

function startScheduler() {
    if (auctionInterval) return;
    auctionInterval = setInterval(startAuction, 2 * 60 * 1000);
    startAuction(); // Start immediately
}

function stopScheduler() {
    if (auctionInterval) clearInterval(auctionInterval);
    if (auctionTimeout) clearTimeout(auctionTimeout);
}

module.exports = { startScheduler, stopScheduler };
