const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "inventory",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "View your owned auction items",
    commandCategory: "economy",
    usages: "",
    cooldowns: 10
};

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID } = event;
    
    // Load user's inventory
    let userInventory = [];
    
    try {
        // Check if inventory data file exists
        const inventoryPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_inventory.json');
        
        if (fs.existsSync(inventoryPath)) {
            const inventoryData = await fs.readJson(inventoryPath);
            userInventory = inventoryData[senderID] || [];
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        userInventory = [];
    }
    
    // Get user's name
    const userName = await Users.getNameUser(senderID);
    
    if (userInventory.length === 0) {
        return api.sendMessage(
            `👝 ${userName}'s Inventory\n\n` +
            `You don't own any auction items yet.\n\n` +
            `Participate in auctions using the '!auction' command and bid on items with '!bid <amount>' to win items!`,
            threadID, messageID
        );
    }
    
    // Format inventory items
    let inventoryMessage = `👝 ${userName}'s Inventory\n\n`;
    
    for (let i = 0; i < userInventory.length; i++) {
        const item = userInventory[i];
        const forSaleText = item.isForSale ? `🏷️ For Sale: $${item.salePrice}` : '🔒 Not For Sale';
        
        inventoryMessage += `${i + 1}. ${item.name}\n`;
        inventoryMessage += `   Description: ${item.description}\n`;
        inventoryMessage += `   ${forSaleText}\n`;
        inventoryMessage += `   ID: ${item.id}\n\n`;
    }
    
    inventoryMessage += `Use '!sell <item ID> <price>' to put an item up for sale.\n`;
    inventoryMessage += `Use '!unsell <item ID>' to remove an item from sale.`;
    
    return api.sendMessage(inventoryMessage, threadID, messageID);
};