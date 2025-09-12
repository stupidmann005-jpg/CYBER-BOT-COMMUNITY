module.exports.config = {
    name: "auctionInit",
    eventType: ["ready"],
    version: "1.1.0",
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️ 𖣘 BOT TEAM (Fixed by GPT)",
    description: "Initialize the auction system when bot starts"
};

const fs = require('fs-extra');
const path = require('path');

// Global flag to track if auction system has been initialized
global.auctionSystemInitialized = false;

module.exports.run = async function({ api, event }) {
    console.log('⚡ Initializing auction system...');

    // Prevent running twice
    if (global.auctionSystemInitialized) {
        console.log('[AUCTION SYSTEM] Already initialized, skipping.');
        return;
    }

    // Ensure global.api exists
    if (!global.api && api) {
        global.api = api;
        console.log('[AUCTION SYSTEM] Stored API in global');
    }

    // Cache setup
    const cachePath = path.join(__dirname, '..', '..', 'includes', 'cache');
    const inventoryPath = path.join(cachePath, 'auction_inventory.json');
    const marketplacePath = path.join(cachePath, 'auction_marketplace.json');
    const auctionHistoryPath = path.join(cachePath, 'auction_history.json');

    try {
        await fs.ensureDir(cachePath);
        if (!await fs.pathExists(inventoryPath)) await fs.writeJson(inventoryPath, {}, { spaces: 2 });
        if (!await fs.pathExists(marketplacePath)) await fs.writeJson(marketplacePath, [], { spaces: 2 });
        if (!await fs.pathExists(auctionHistoryPath)) await fs.writeJson(auctionHistoryPath, [], { spaces: 2 });

        // Initialize auction state
        global.globalAuction = {
            isActive: false,
            currentItem: null,
            startTime: null,
            endTime: null,
            highestBid: 0,
            highestBidder: null,
            bids: []
        };

        // Load auction command
        const auctionModule = require('../commands/auction');
        if (!global.client.commands.has('auction')) {
            global.client.commands.set('auction', auctionModule);
            console.log('[AUCTION SYSTEM] Auction command loaded manually');
        } else {
            console.log('[AUCTION SYSTEM] Auction command already loaded');
        }

        // Start auction cycle after short delay
        setTimeout(() => {
            try {
                if (typeof auctionModule.startAuctionCycle === "function") {
                    console.log('[AUCTION SYSTEM] Starting auction cycle...');
                    auctionModule.startAuctionCycle(api || global.api);
                } else {
                    console.error('[AUCTION SYSTEM] startAuctionCycle not found!');
                }
            } catch (err) {
                console.error('[AUCTION SYSTEM] Error starting cycle:', err);
            }
        }, 8000); // 8 sec delay

        // Periodic check every 10 min
        setInterval(() => {
            try {
                console.log('[AUCTION SYSTEM] Checking auction health...');
                if (!global.globalAuction || !global.globalAuction.isActive) {
                    console.log('[AUCTION SYSTEM] No active auction, restarting...');
                    auctionModule.startAuctionCycle(api || global.api);
                }
            } catch (err) {
                console.error('[AUCTION SYSTEM] Error in periodic check:', err);
            }
        }, 10 * 60 * 1000);

        global.auctionSystemInitialized = true;
        console.log('[AUCTION SYSTEM] ✅ Auction system initialized successfully!');
    } catch (err) {
        console.error('[AUCTION SYSTEM] Initialization failed:', err);
    }
};
