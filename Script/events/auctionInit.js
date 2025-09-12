module.exports.config = {
    name: "auctionInit",
    eventType: ["ready"],
    version: "1.0.0",
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Initialize the auction system when bot starts"
};

const fs = require('fs-extra');
const path = require('path');

module.exports.run = async function({ api, event }) {
    console.log('Initializing auction system...');
    
    // Create necessary cache directories and files
    const cachePath = path.join(__dirname, '..', '..', 'includes', 'cache');
    const inventoryPath = path.join(cachePath, 'auction_inventory.json');
    const marketplacePath = path.join(cachePath, 'auction_marketplace.json');
    const auctionHistoryPath = path.join(cachePath, 'auction_history.json');
    
    try {
        // Ensure cache directory exists
        await fs.ensureDir(cachePath);
        
        // Create inventory file if it doesn't exist
        if (!await fs.pathExists(inventoryPath)) {
            await fs.writeJson(inventoryPath, {}, { spaces: 2 });
        }
        
        // Create marketplace file if it doesn't exist
        if (!await fs.pathExists(marketplacePath)) {
            await fs.writeJson(marketplacePath, [], { spaces: 2 });
        }
        
        // Create auction history file if it doesn't exist
        if (!await fs.pathExists(auctionHistoryPath)) {
            await fs.writeJson(auctionHistoryPath, [], { spaces: 2 });
        }
        
        // Initialize global auction state
        global.globalAuction = {
            isActive: false,
            currentItem: null,
            startTime: null,
            endTime: null,
            highestBid: 0,
            highestBidder: null,
            bids: []
        };
        
        // Start the auction cycle
        const auctionModule = require('../commands/auction');
        if (typeof auctionModule.startAuctionCycle === 'function') {
            auctionModule.startAuctionCycle(api);
            console.log('Auction cycle started successfully');
        } else {
            console.error('Failed to start auction cycle: startAuctionCycle function not found');
        }
        
        console.log('Auction system initialized successfully');
    } catch (error) {
        console.error('Error initializing auction system:', error);
    }
};