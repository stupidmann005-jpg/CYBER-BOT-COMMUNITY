module.exports.config = {
    name: "auctionInit",
    eventType: ["ready"],
    version: "1.0.0",
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Initialize the auction system when bot starts"
};

const fs = require('fs-extra');
const path = require('path');

module.exports.run = async function({ api, event, client }) {
    // Make sure this event runs only once when the bot starts
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
        
        // Check if the auction command is registered in the bot's command list
        if (!global.client || !global.client.commands) {
            console.error('Bot client or commands not initialized yet');
        } else {
            // Make sure the auction command is loaded
            if (!global.client.commands.has('auction')) {
                try {
                    // Try to load the auction command manually
                    const auctionModule = require('../commands/auction');
                    global.client.commands.set('auction', auctionModule);
                    console.log('Auction command loaded manually');
                } catch (error) {
                    console.error('Failed to load auction command:', error);
                }
            } else {
                console.log('Auction command already loaded');
            }
        }
        
        // Start the auction cycle
        try {
            const auctionModule = require('../commands/auction');
            if (typeof auctionModule.startAuctionCycle === 'function') {
                auctionModule.startAuctionCycle(api);
                console.log('Auction cycle started successfully');
            } else {
                console.error('Failed to start auction cycle: startAuctionCycle function not found');
            }
        } catch (error) {
            console.error('Error starting auction cycle:', error);
        }
        
        console.log('Auction system initialized successfully');
    } catch (error) {
        console.error('Error initializing auction system:', error);
    }
};
