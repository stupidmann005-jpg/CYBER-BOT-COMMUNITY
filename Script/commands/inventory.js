const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "inventory",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "View your auction inventory",
    commandCategory: "economy",
    usages: "",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID } = event;
    
    console.log('Inventory command executed');
    
    try {
        // Get user's name
        const userData = await Users.getData(senderID);
        const userName = userData.name || "Unknown User";
        
        // Load inventory data
        const inventoryPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_inventory.json');
        let inventoryData = {};
        
        if (await fs.pathExists(inventoryPath)) {
            inventoryData = await fs.readJson(inventoryPath);
        }
        
        // Get user's inventory
        const userInventory = inventoryData[senderID] || [];
        
        if (userInventory.length === 0) {
            return api.sendMessage(
                `${userName}, you don't have any items in your inventory.\n\n` +
                `Participate in auctions to win items!`,
                threadID, messageID
            );
        }
        
        // Format inventory items
        let inventoryMessage = `🎒 ${userName}'s Inventory 🎒\n\n`;
        
        userInventory.forEach((item, index) => {
            inventoryMessage += `${index + 1}. ${item.name}\n` +
                               `   Description: ${item.description}\n` +
                               `   Purchased for: $${item.purchasePrice}\n` +
                               `   Date acquired: ${new Date(item.purchaseDate).toLocaleDateString()}\n` +
                               `   Status: ${item.isForSale ? `For sale at $${item.salePrice}` : 'Not for sale'}\n\n`;
        });
        
        inventoryMessage += `Use '!sell <item number> <price>' to list an item for sale.\n` +
                           `Use '!unsell <item number>' to remove an item from sale.`;
        
        return api.sendMessage(inventoryMessage, threadID, messageID);
    } catch (error) {
        console.error('Error retrieving inventory:', error);
        return api.sendMessage(
            "There was an error retrieving your inventory. Please try again later.",
            threadID, messageID
        );
    }
};
