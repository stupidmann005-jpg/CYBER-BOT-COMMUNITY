const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "marketplace",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "View items for sale in the marketplace",
    commandCategory: "economy",
    usages: "",
    cooldowns: 10,
    aliases: ["market", "shop"]
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;
    
    // Load marketplace data
    const marketplacePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_marketplace.json');
    let marketplace = [];
    
    try {
        if (fs.existsSync(marketplacePath)) {
            marketplace = await fs.readJson(marketplacePath);
        }
    } catch (error) {
        console.error('Error loading marketplace:', error);
        marketplace = [];
    }
    
    if (marketplace.length === 0) {
        return api.sendMessage(
            "🏪 Auction Marketplace\n\n" +
            "There are no items currently for sale.\n\n" +
            "Win items in auctions using '!auction' and '!bid', then sell them using '!sell <item ID> <price>'.",
            threadID, messageID
        );
    }
    
    // Format marketplace listings
    let marketMessage = "🏪 Auction Marketplace\n\n";
    marketMessage += "Items currently for sale:\n\n";
    
    for (let i = 0; i < marketplace.length; i++) {
        const item = marketplace[i];
        
        marketMessage += `${i + 1}. ${item.itemName}\n`;
        marketMessage += `   Description: ${item.itemDescription}\n`;
        marketMessage += `   Price: $${item.price}\n`;
        marketMessage += `   Seller: ${item.sellerName}\n`;
        marketMessage += `   Item ID: ${item.itemId}\n\n`;
    }
    
    marketMessage += "To purchase an item, use '!buy <item ID>'";
    
    return api.sendMessage(marketMessage, threadID, messageID);
};