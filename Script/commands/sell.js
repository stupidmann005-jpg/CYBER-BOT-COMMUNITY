const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "sell",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Put an auction item up for sale",
    commandCategory: "economy",
    usages: "<item ID> <price>",
    cooldowns: 10
};

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID } = event;
    
    if (args.length < 2) {
        return api.sendMessage(
            "❌ Please provide both the item ID and the selling price.\n\n" +
            "Usage: !sell <item ID> <price>",
            threadID, messageID
        );
    }
    
    const itemId = args[0];
    const salePrice = parseInt(args[1]);
    
    if (isNaN(salePrice) || salePrice <= 0) {
        return api.sendMessage("❌ Please enter a valid selling price.", threadID, messageID);
    }
    
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
    
    // Update item to be for sale
    userInventory[itemIndex].isForSale = true;
    userInventory[itemIndex].salePrice = salePrice;
    inventoryData[senderID] = userInventory;
    
    // Update marketplace listing
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
    
    // Remove any existing listings by this user for this item
    marketplace = marketplace.filter(listing => !(listing.itemId === itemId && listing.sellerId === senderID));
    
    // Add new listing
    const item = userInventory[itemIndex];
    marketplace.push({
        itemId: itemId,
        sellerId: senderID,
        sellerName: await Users.getNameUser(senderID),
        itemName: item.name,
        itemDescription: item.description,
        imageURL: item.imageURL,
        price: salePrice,
        listedAt: new Date().toISOString()
    });
    
    // Save updated data
    await fs.writeJson(inventoryPath, inventoryData, { spaces: 2 });
    await fs.writeJson(marketplacePath, marketplace, { spaces: 2 });
    
    return api.sendMessage(
        `✅ You have put "${item.name}" up for sale for $${salePrice}.\n\n` +
        `Other users can now buy it using the '!buy ${itemId}' command.`,
        threadID, messageID
    );
};