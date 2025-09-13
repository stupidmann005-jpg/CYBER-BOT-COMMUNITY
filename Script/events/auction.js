module.exports.config = {
    name: "auction",
    eventType: ["log:subscribe", "log:unsubscribe", "message"],
    version: "1.0.0",
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Auto announces auctions",
    dependencies: {
        "fs-extra": "",
        "path": "",
        "sequelize": ""
    }
};

const fs = require('fs-extra');
const path = require('path');
const { AuctionItems, initializeDatabase } = require("../../includes/database/models/auctionModel");

let lastCheckTime = 0;
let isProcessing = false;

module.exports.onLoad = async function () {
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];

    const auctionDir = join(__dirname, "..", "..", "includes", "cache", "auction");
    if (!existsSync(auctionDir)) mkdirSync(auctionDir, { recursive: true });
    
    // Initialize the database
    await initializeDatabase();
    
    console.log('[ AUCTION ] Event loaded. Auction system ready.');
}

module.exports.run = async function({ api, event }) {
    const { threadID } = event;
    
    // Only check every 30 seconds to avoid spamming
    const now = Date.now();
    if (now - lastCheckTime < 30000 || isProcessing) return;
    
    isProcessing = true;
    lastCheckTime = now;

    try {
        console.log("[AUCTION] Checking for auctions...");

        // Check for active auctions
        const activeAuction = await AuctionItems.findOne({
            where: { status: 'active' }
        });

        if (activeAuction) {
            // If auction has been running for more than 2 minutes, end it
            if (now - activeAuction.auctionStartTime >= 120000) { // 2 minutes
                console.log("[AUCTION] Ending auction for:", activeAuction.name);
                
                // Announce auction end
                const endMessage = activeAuction.currentBidder 
                    ? `🔨 Auction Ended! 🔨\n\n` +
                      `Item: ${activeAuction.name}\n` +
                      `Final Price: $${activeAuction.currentBid}\n` +
                      `Winner: ${activeAuction.currentBidder}`
                    : `🔨 Auction Ended! 🔨\n\n` +
                      `Item: ${activeAuction.name}\n` +
                      `No bids were placed.`;

                await api.sendMessage(endMessage, threadID);

                // Update item status
                if (activeAuction.currentBidder) {
                    await activeAuction.update({
                        status: 'sold',
                        soldPrice: activeAuction.currentBid,
                        soldTo: activeAuction.currentBidder
                    });
                } else {
                    await activeAuction.update({ status: 'pending' });
                }
            }
        } else {
            // No active auction, try to start one
            const pendingItem = await AuctionItems.findOne({
                where: {
                    status: 'pending',
                    enabled: true
                },
                order: [['createdAt', 'ASC']]
            });

            if (pendingItem) {
                console.log("[AUCTION] Starting new auction for:", pendingItem.name);
                
                // Start new auction
                await pendingItem.update({
                    status: 'active',
                    auctionStartTime: now,
                    currentBid: pendingItem.minimumBid,
                    currentBidder: null
                });

                // Announce new auction
                const startMessage = "🎉 New Auction Started! 🎉\n\n" +
                                   `Item: ${pendingItem.name}\n` +
                                   `Description: ${pendingItem.description}\n` +
                                   `Starting Bid: $${pendingItem.minimumBid}\n` +
                                   `Duration: 2 minutes\n\n` +
                                   "To bid, use: /bid <amount>";

                await api.sendMessage(startMessage, threadID);
            }
        }
    } catch (error) {
        console.error("[AUCTION] Error:", error);
    } finally {
        isProcessing = false;
    }
};