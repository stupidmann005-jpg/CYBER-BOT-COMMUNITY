module.exports.config = {
    name: "auctionInit",
    eventType: ["ready"],
    version: "1.0.0",
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Initialize the auction system when bot starts"
};

const fs = require('fs-extra');
const path = require('path');

// Global flag to track if auction system has been initialized
global.auctionSystemInitialized = false;

module.exports.run = async function({ api, event, client }) {
    // Make sure this event runs only once when the bot starts
    console.log('Initializing auction system...');
    
    // Check if auction system is already initialized
    if (global.auctionSystemInitialized) {
        console.log('[AUCTION SYSTEM] Auction system already initialized, skipping');
        return;
    }
    
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
        
        // Start the auction cycle with enhanced logging
        try {
            console.log('[AUCTION SYSTEM] Loading auction module...');
            const auctionModule = require('../commands/auction');
            console.log('[AUCTION SYSTEM] Auction module loaded successfully');
            
            if (typeof auctionModule.startAuctionCycle === 'function') {
                console.log('[AUCTION SYSTEM] startAuctionCycle function found');
                
                // Store API in global for access by other components
                if (!global.api && api) {
                    global.api = api;
                    console.log('[AUCTION SYSTEM] API stored in global for auction system');
                } else if (global.api) {
                    console.log('[AUCTION SYSTEM] API already exists in global');
                } else {
                    console.error('[AUCTION SYSTEM] API not available!');
                }
                
                // Start the auction cycle with a delay to ensure everything is loaded
                console.log('[AUCTION SYSTEM] Setting up auction cycle with 10 second delay...');
                setTimeout(() => {
                    try {
                        console.log('[AUCTION SYSTEM] Attempting to start auction cycle...');
                        auctionModule.startAuctionCycle(api);
                        console.log('[AUCTION SYSTEM] Auction cycle started successfully from event');
                    } catch (innerError) {
                        console.error('[AUCTION SYSTEM] Error starting auction cycle from setTimeout:', innerError);
                    }
                }, 10000); // Increased to 10 seconds for better reliability
            } else {
                console.error('[AUCTION SYSTEM] Failed to start auction cycle: startAuctionCycle function not found');
            }
        } catch (error) {
            console.error('Error starting auction cycle:', error);
        }
        
        console.log('[AUCTION SYSTEM] Auction system initialized successfully');
        
        // Set the global flag to indicate that auction system has been initialized
        global.auctionSystemInitialized = true;
        
        // Set up a recurring check to ensure auction is running
        setInterval(() => {
            try {
                console.log('[AUCTION SYSTEM] Running periodic check for auction system');
                if (!global.globalAuction || !global.globalAuction.isActive) {
                    console.log('[AUCTION SYSTEM] No active auction found, attempting to restart auction cycle');
                    const auctionModule = require('../commands/auction');
                    if (typeof auctionModule.startAuctionCycle === 'function') {
                        auctionModule.startAuctionCycle(api || global.api);
                    }
                } else {
                    console.log('[AUCTION SYSTEM] Auction system is active and running');
                }
            } catch (checkError) {
                console.error('[AUCTION SYSTEM] Error during periodic auction check:', checkError);
            }
        }, 15 * 60 * 1000); // Check every 15 minutes
    } catch (error) {
        console.error('[AUCTION SYSTEM] Error initializing auction system:', error);
    }
};
