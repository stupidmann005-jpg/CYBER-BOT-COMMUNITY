const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports.config = {
    name: "auction",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "View current auction or start a new one",
    commandCategory: "economy",
    usages: "",
    cooldowns: 10,
    dependencies: {
        "fs-extra": "",
        "path": "",
        "axios": "",
        "uuid": ""
    }
};

// Add onLoad function to initialize the auction when the bot starts
module.exports.onLoad = async function() {
    try {
        console.log('[AUCTION SYSTEM] Auction command loaded successfully');
        // Initialize global auction state if not already initialized
        if (!global.globalAuction) {
            console.log('[AUCTION SYSTEM] Initializing global auction state');
            global.globalAuction = {
                isActive: false,
                currentItem: null,
                startTime: null,
                endTime: null,
                highestBid: 0,
                highestBidder: null,
                bids: [],
                lastCheck: Date.now() // Add timestamp for monitoring
            };
            console.log('[AUCTION SYSTEM] Global auction state initialized');
        } else {
            console.log('[AUCTION SYSTEM] Global auction state already exists');
            // Update the lastCheck timestamp
            global.globalAuction.lastCheck = Date.now();
        }
        
        // Register this module globally for easier access
        if (!global.auctionModule) {
            global.auctionModule = module.exports;
            console.log('[AUCTION SYSTEM] Auction module registered globally');
        }
        
        // Start the auction cycle automatically when the command is loaded
        // Use setTimeout to ensure the bot is fully initialized before starting auctions
        console.log('[AUCTION SYSTEM] Setting up auction cycle from onLoad with 15 second delay...');
        setTimeout(() => {
            console.log('[AUCTION SYSTEM] Attempting to start auction cycle from onLoad...');
            if (typeof this.startAuctionCycle === 'function') {
                console.log('[AUCTION SYSTEM] startAuctionCycle function found in onLoad');
                // Get the api instance from global
                const api = global.api;
                if (api) {
                    console.log('[AUCTION SYSTEM] API found in global, starting auction cycle...');
                    try {
                        this.startAuctionCycle(api);
                        console.log('[AUCTION SYSTEM] Auction cycle started successfully from command onLoad');
                    } catch (cycleError) {
                        console.error('[AUCTION SYSTEM] Error starting auction cycle from onLoad:', cycleError);
                    }
                } else {
                    console.error('Cannot start auction cycle: API not available');
                }
            } else {
                console.error('startAuctionCycle function not found in auction command');
            }
        }, 10000); // Wait 10 seconds after bot starts to begin auction cycle
    } catch (error) {
        console.error('Error initializing auction command:', error);
    }
};

// Sample auction items
const sampleItems = [
    {
        name: "Rare Diamond Ring",
        description: "A stunning diamond ring with exceptional clarity",
        imageURL: "https://i.imgur.com/JQpMcbj.jpg",
        minimumBid: 1000
    },
    {
        name: "Vintage Watch",
        description: "A classic timepiece with intricate craftsmanship",
        imageURL: "https://i.imgur.com/8BU2zJG.jpg",
        minimumBid: 800
    },
    {
        name: "Golden Crown",
        description: "A symbol of royalty and power",
        imageURL: "https://i.imgur.com/qgZLZdM.jpg",
        minimumBid: 1500
    },
    {
        name: "Mystic Sword",
        description: "A legendary weapon said to possess magical powers",
        imageURL: "https://i.imgur.com/YJfzYmR.jpg",
        minimumBid: 1200
    },
    {
        name: "Ancient Scroll",
        description: "Contains forgotten knowledge from a lost civilization",
        imageURL: "https://i.imgur.com/JNhqkpO.jpg",
        minimumBid: 500
    },
    {
        name: "Crystal Orb",
        description: "A mysterious orb that glows with ethereal light",
        imageURL: "https://i.imgur.com/8wqd1sD.jpg",
        minimumBid: 700
    },
    {
        name: "Enchanted Amulet",
        description: "Grants protection against dark magic",
        imageURL: "https://i.imgur.com/VrjWrqQ.jpg",
        minimumBid: 900
    },
    {
        name: "Dragon Scale Armor",
        description: "Forged from the scales of an ancient dragon",
        imageURL: "https://i.imgur.com/kYvQXmC.jpg",
        minimumBid: 2000
    },
    {
        name: "Phoenix Feather",
        description: "A rare feather that never burns",
        imageURL: "https://i.imgur.com/JZSWRmw.jpg",
        minimumBid: 600
    },
    {
        name: "Celestial Map",
        description: "Charts the stars of distant galaxies",
        imageURL: "https://i.imgur.com/QdBwMGP.jpg",
        minimumBid: 1100
    }
];

// Function to start the auction cycle
module.exports.startAuctionCycle = async function(api) {
    console.log('[AUCTION SYSTEM] startAuctionCycle function called');
    
    // Update the last check timestamp
    if (global.globalAuction) {
        global.globalAuction.lastCheck = Date.now();
    }
    
    // Ensure we have a valid API
    if (!api) {
        console.error('[AUCTION SYSTEM] API not provided to startAuctionCycle, attempting to use global.api');
        api = global.api;
        if (!api) {
            console.error('[AUCTION SYSTEM] No API available, cannot start auction cycle');
            
            // Set up a retry mechanism
            console.log('[AUCTION SYSTEM] Setting up retry for auction cycle in 30 seconds');
            setTimeout(() => {
                console.log('[AUCTION SYSTEM] Retrying to start auction cycle');
                if (global.api) {
                    module.exports.startAuctionCycle(global.api);
                } else {
                    console.error('[AUCTION SYSTEM] Still no API available after retry');
                }
            }, 30000);
            return;
        }
    }
    
    // Store API in global for future use if not already there
    if (!global.api && api) {
        global.api = api;
        console.log('[AUCTION SYSTEM] API stored in global from startAuctionCycle');
    }
    
    try {
        console.log('[AUCTION SYSTEM] Starting new auction...');
        // Start a new auction
        await startNewAuction(api);
        console.log('[AUCTION SYSTEM] New auction started successfully');
        
        // Schedule the next auction after 4 minutes (2 min auction + 2 min break)
        console.log('[AUCTION SYSTEM] Scheduling next auction cycle in 4 minutes');
        setTimeout(() => {
            console.log('[AUCTION SYSTEM] Time elapsed, starting next auction cycle');
            module.exports.startAuctionCycle(api);
        }, 4 * 60 * 1000);
    } catch (error) {
        console.error('[AUCTION SYSTEM] Error in auction cycle:', error);
        // Try to restart the cycle after a delay
        console.log('[AUCTION SYSTEM] Will attempt to restart auction cycle in 5 minutes');
        setTimeout(() => {
            console.log('[AUCTION SYSTEM] Attempting to restart auction cycle after error');
            module.exports.startAuctionCycle(api);
        }, 5 * 60 * 1000);
    }
};

// Function to start a new auction
async function startNewAuction(api) {
    console.log('[AUCTION SYSTEM] startNewAuction function called');
    if (!api) {
        console.error('[AUCTION SYSTEM] API not provided to startNewAuction, cannot proceed');
        return;
    }
    
    // Select a random item
    console.log('[AUCTION SYSTEM] Selecting random item for auction');
    const randomItem = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    console.log(`[AUCTION SYSTEM] Selected item: ${randomItem.name}`);
    
    // Generate a unique ID for this item
    const itemId = uuidv4();
    
    // Set up auction details
    global.globalAuction = {
        isActive: true,
        currentItem: {
            id: itemId,
            name: randomItem.name,
            description: randomItem.description,
            imageURL: randomItem.imageURL,
            minimumBid: randomItem.minimumBid
        },
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
        highestBid: randomItem.minimumBid,
        highestBidder: null,
        bids: []
    };
    
    // Announce the auction in all active threads
    const threads = await api.getThreadList(20, null, ['INBOX']);
    for (const thread of threads) {
        if (thread.isGroup) {
            try {
                // Download the image
                const imagePath = path.join(__dirname, '..', '..', 'includes', 'cache', `auction_${itemId}.jpg`);
                const imageResponse = await axios.get(randomItem.imageURL, { responseType: 'arraybuffer' });
                await fs.writeFile(imagePath, Buffer.from(imageResponse.data));
                
                // Send the auction announcement with the image
                await api.sendMessage(
                    {
                        body: `🔔 NEW AUCTION STARTED! 🔔\n\n` +
                              `Item: ${randomItem.name}\n` +
                              `Description: ${randomItem.description}\n` +
                              `Starting Bid: $${randomItem.minimumBid}\n\n` +
                              `⏰ This auction will end in 2 minutes!\n\n` +
                              `To place a bid, use: !bid <amount>`,
                        attachment: fs.createReadStream(imagePath)
                    },
                    thread.threadID
                );
            } catch (error) {
                console.error(`Error announcing auction in thread ${thread.threadID}:`, error);
            }
        }
    }
    
    // Set a timeout to end the auction
    global.auctionTimeout = setTimeout(() => {
        module.exports.endAuction(api);
    }, 2 * 60 * 1000); // 2 minutes
}

// Function to end an auction
module.exports.endAuction = async function(api, specificThreadID = null) {
    if (!global.globalAuction || !global.globalAuction.isActive) {
        return;
    }
    
    // Mark the auction as inactive
    global.globalAuction.isActive = false;
    
    const item = global.globalAuction.currentItem;
    const highestBid = global.globalAuction.highestBid;
    const highestBidderID = global.globalAuction.highestBidder;
    
    // Prepare announcement message
    let endMessage;
    
    if (highestBidderID) {
        // Someone won the auction
        try {
            // Get winner's name
            const Users = require('../../includes/database/models/users');
            const winnerData = await Users.getData(highestBidderID);
            const winnerName = winnerData.name || "Unknown User";
            
            // Deduct money from winner's wallet
            const Currencies = require('../../includes/database/models/currencies');
            await Currencies.decreaseMoney(highestBidderID, highestBid);
            
            // Add item to winner's inventory
            const inventoryPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_inventory.json');
            let inventoryData = {};
            
            try {
                if (fs.existsSync(inventoryPath)) {
                    inventoryData = await fs.readJson(inventoryPath);
                }
            } catch (error) {
                console.error('Error loading inventory:', error);
                inventoryData = {};
            }
            
            // Add to winner's inventory
            const winnerInventory = inventoryData[highestBidderID] || [];
            winnerInventory.push({
                id: item.id,
                name: item.name,
                description: item.description,
                imageURL: item.imageURL,
                minimumBid: item.minimumBid,
                purchasePrice: highestBid,
                purchaseDate: new Date().toISOString(),
                isForSale: false,
                salePrice: 0,
                ownerID: highestBidderID
            });
            inventoryData[highestBidderID] = winnerInventory;
            
            // Save updated inventory
            await fs.writeJson(inventoryPath, inventoryData, { spaces: 2 });
            
            // Record auction in history
            const historyPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_history.json');
            let historyData = [];
            
            try {
                if (fs.existsSync(historyPath)) {
                    historyData = await fs.readJson(historyPath);
                }
            } catch (error) {
                console.error('Error loading auction history:', error);
                historyData = [];
            }
            
            // Add to history
            historyData.push({
                itemId: item.id,
                itemName: item.name,
                winnerID: highestBidderID,
                winnerName: winnerName,
                finalBid: highestBid,
                auctionStart: global.globalAuction.startTime,
                auctionEnd: new Date(),
                bids: global.globalAuction.bids
            });
            
            // Save updated history
            await fs.writeJson(historyPath, historyData, { spaces: 2 });
            
            endMessage = `🎉 AUCTION ENDED! 🎉\n\n` +
                       `Item: ${item.name}\n` +
                       `Final Price: $${highestBid}\n` +
                       `Winner: ${winnerName}\n\n` +
                       `Congratulations! The item has been added to your inventory.\n` +
                       `Use '!inventory' to view your items.`;
        } catch (error) {
            console.error('Error processing auction winner:', error);
            endMessage = `🎉 AUCTION ENDED! 🎉\n\n` +
                       `Item: ${item.name}\n` +
                       `Final Price: $${highestBid}\n\n` +
                       `There was an error processing the winner. Please contact an administrator.`;
        }
    } else {
        // No bids were placed
        endMessage = `🔔 AUCTION ENDED! 🔔\n\n` +
                   `Item: ${item.name}\n` +
                   `No bids were placed. The item remains unsold.`;
    }
    
    // Announce the end of the auction
    if (specificThreadID) {
        // If a specific thread ID is provided, only announce there
        await api.sendMessage(endMessage, specificThreadID);
    } else {
        // Otherwise announce in all active threads
        const threads = await api.getThreadList(20, null, ['INBOX']);
        for (const thread of threads) {
            if (thread.isGroup) {
                try {
                    await api.sendMessage(endMessage, thread.threadID);
                } catch (error) {
                    console.error(`Error announcing auction end in thread ${thread.threadID}:`, error);
                }
            }
        }
    }
    
    // Clean up the image file
    try {
        const imagePath = path.join(__dirname, '..', '..', 'includes', 'cache', `auction_${item.id}.jpg`);
        if (await fs.pathExists(imagePath)) {
            await fs.unlink(imagePath);
        }
    } catch (error) {
        console.error('Error cleaning up auction image:', error);
    }
    
    // Clear the auction timeout
    if (global.auctionTimeout) {
        clearTimeout(global.auctionTimeout);
        global.auctionTimeout = null;
    }
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;
    
    console.log('Auction command executed');
    
    if (!global.globalAuction || !global.globalAuction.isActive) {
        return api.sendMessage(
            "There is no active auction right now.\n\n" +
            "A new auction will start automatically soon.\n\n" +
            "In the meantime, you can:\n" +
            "- Check your inventory with '!inventory'\n" +
            "- Browse items for sale with '!marketplace'\n" +
            "- Buy items with '!buy <item ID>'\n" +
            "- Sell your items with '!sell <item ID> <price>'",
            threadID, messageID
        );
    }
    
    const item = global.globalAuction.currentItem;
    const highestBid = global.globalAuction.highestBid;
    let highestBidderName = "No bids yet";
    
    if (global.globalAuction.highestBidder) {
        const Users = require('../../includes/database/models/users');
        const userData = await Users.getData(global.globalAuction.highestBidder);
        highestBidderName = userData.name || "Unknown User";
    }
    
    // Calculate time remaining
    const now = new Date();
    const endTime = new Date(global.globalAuction.endTime);
    const timeLeftMs = endTime - now;
    const minutesLeft = Math.floor(timeLeftMs / 60000);
    const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
    
    // Download the image
    const imagePath = path.join(__dirname, '..', '..', 'includes', 'cache', `auction_${item.id}.jpg`);
    let attachment = null;
    
    try {
        if (!await fs.pathExists(imagePath)) {
            const imageResponse = await axios.get(item.imageURL, { responseType: 'arraybuffer' });
            await fs.writeFile(imagePath, Buffer.from(imageResponse.data));
        }
        attachment = fs.createReadStream(imagePath);
    } catch (error) {
        console.error('Error downloading auction image:', error);
    }
    
    // Send auction status
    return api.sendMessage(
        {
            body: `🔔 CURRENT AUCTION 🔔\n\n` +
                  `Item: ${item.name}\n` +
                  `Description: ${item.description}\n` +
                  `Current Bid: $${highestBid}\n` +
                  `Highest Bidder: ${highestBidderName}\n` +
                  `Time Remaining: ${minutesLeft}m ${secondsLeft}s\n\n` +
                  `To place a bid, use: !bid <amount>`,
            attachment: attachment
        },
        threadID, messageID
    );
};
