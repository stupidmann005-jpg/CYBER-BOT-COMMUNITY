const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "unsell",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Remove an item from sale",
    commandCategory: "economy",
    usages: "<item ID>",
    cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    if (args.length < 1) {
        return api.sendMessage(
            "❌ Please provide the item ID.\n\n" +
            "Usage: !unsell <item ID>",
            threadID, messageID
        );
    }
    
    const itemId = args[0];
    
    // Load inventory data
    const inventoryPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_inventory.json');
    let inventoryData = {};
    
    try {
        if (fs.existsSync(inventoryPath)) {
            inventoryData = await fs.readJson(inventoryPath);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        return api.sendMessage("❌ An error occurred while accessing your inventory.", threadID, messageID);
    }
    
    // Check if user has the item
    const userInventory = inventoryData[senderID] || [];
    const itemIndex = userInventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
        return api.sendMessage(
            "❌ You don't own an item with that ID.\n\n" +
            "Use '!inventory' to see your items and their IDs.",
            threadID, messageID
        );
    }
    
    // Check if the item is actually for sale
    if (!userInventory[itemIndex].isForSale) {
        return api.sendMessage(
            "❌ This item is not currently for sale.",
            threadID, messageID
        );
    }
    
    // Update item to be not for sale
    userInventory[itemIndex].isForSale = false;
    userInventory[itemIndex].salePrice = 0;
    inventoryData[senderID] = userInventory;
    
    // Update marketplace listing
    const marketplacePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_marketplace.json');
    let marketplace = [];
    
    try {
        if (fs.existsSync(marketplacePath)) {
            marketplace = await fs.readJson(marketplacePath);
            // Remove the listing
            marketplace = marketplace.filter(listing => !(listing.itemId === itemId && listing.sellerId === senderID));
        }
    } catch (error) {
        console.error('Error updating marketplace:', error);
    }
    
    // Save updated data
    await fs.writeJson(inventoryPath, inventoryData, { spaces: 2 });
    await fs.writeJson(marketplacePath, marketplace, { spaces: 2 });
    
    return api.sendMessage(
        `✅ You have removed "${userInventory[itemIndex].name}" from sale.\n\n` +
        `The item is now back in your inventory and not available for purchase.`,
        threadID, messageID
    );
};