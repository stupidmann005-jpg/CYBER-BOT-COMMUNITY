const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

module.exports.config = {
    name: "buy",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Buy an item from the marketplace",
    commandCategory: "economy",
    usages: "<item ID>",
    cooldowns: 10
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID } = event;
    
    if (args.length < 1) {
        return api.sendMessage(
            "❌ Please provide the item ID.\n\n" +
            "Usage: !buy <item ID>\n\n" +
            "You can view available items using '!marketplace'.",
            threadID, messageID
        );
    }
    
    const itemId = args[0];
    
    // Load marketplace data
    const marketplacePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_marketplace.json');
    let marketplace = [];
    
    try {
        if (fs.existsSync(marketplacePath)) {
            marketplace = await fs.readJson(marketplacePath);
        }
    } catch (error) {
        console.error('Error loading marketplace:', error);
        return api.sendMessage("❌ An error occurred while accessing the marketplace.", threadID, messageID);
    }
    
    // Find the item in the marketplace
    const itemIndex = marketplace.findIndex(item => item.itemId === itemId);
    
    if (itemIndex === -1) {
        return api.sendMessage(
            "❌ No item with that ID is currently for sale.\n\n" +
            "Use '!marketplace' to see available items and their IDs.",
            threadID, messageID
        );
    }
    
    const item = marketplace[itemIndex];
    
    // Check if user is trying to buy their own item
    if (item.sellerId === senderID) {
        return api.sendMessage("❌ You cannot buy your own item.", threadID, messageID);
    }
    
    // Check if user has enough money
    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;
    
    if (item.price > userMoney) {
        return api.sendMessage(
            `❌ You don't have enough money to buy this item.\n\n` +
            `Item price: $${item.price}\n` +
            `Your balance: $${userMoney}`,
            threadID, messageID
        );
    }
    
    // Process the purchase
    // 1. Deduct money from buyer
    await Currencies.decreaseMoney(senderID, item.price);
    
    // 2. Add money to seller
    await Currencies.increaseMoney(item.sellerId, item.price);
    
    // 3. Transfer item ownership
    // Load inventory data
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
    
    // Remove item from seller's inventory
    const sellerInventory = inventoryData[item.sellerId] || [];
    const sellerItemIndex = sellerInventory.findIndex(invItem => invItem.id === itemId);
    
    if (sellerItemIndex !== -1) {
        const itemToTransfer = sellerInventory[sellerItemIndex];
        sellerInventory.splice(sellerItemIndex, 1);
        inventoryData[item.sellerId] = sellerInventory;
        
        // Add item to buyer's inventory
        const buyerInventory = inventoryData[senderID] || [];
        itemToTransfer.isForSale = false;
        itemToTransfer.salePrice = 0;
        buyerInventory.push(itemToTransfer);
        inventoryData[senderID] = buyerInventory;
    } else {
        // If item not found in seller's inventory (shouldn't happen), create a new one
        const buyerInventory = inventoryData[senderID] || [];
        buyerInventory.push({
            id: itemId || uuidv4(),
            name: item.itemName,
            description: item.itemDescription,
            imageURL: item.imageURL,
            isForSale: false,
            salePrice: 0,
            ownerID: senderID
        });
        inventoryData[senderID] = buyerInventory;
    }
    
    // 4. Remove item from marketplace
    marketplace.splice(itemIndex, 1);
    
    // Save updated data
    await fs.writeJson(inventoryPath, inventoryData, { spaces: 2 });
    await fs.writeJson(marketplacePath, marketplace, { spaces: 2 });
    
    // Get user names
    const buyerName = await Users.getNameUser(senderID);
    const sellerName = await Users.getNameUser(item.sellerId);
    
    // Notify buyer
    api.sendMessage(
        `✅ ${buyerName}, you have successfully purchased "${item.itemName}" for $${item.price}!\n\n` +
        `The item has been added to your inventory. Use '!inventory' to view your items.`,
        threadID, messageID
    );
    
    // Notify seller
    api.sendMessage(
        `💰 ${sellerName}, your item "${item.itemName}" has been purchased by ${buyerName} for $${item.price}!\n\n` +
        `The money has been added to your wallet.`,
        item.sellerId
    );
    
    return;
};