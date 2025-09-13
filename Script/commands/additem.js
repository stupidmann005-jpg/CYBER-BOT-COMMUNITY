// Command: additem
// Add a new item to the auction system
const { AuctionItems } = require('../../includes/database/models');

module.exports = {
  config: {
    name: 'additem',
    description: 'Add a new item to the auction system (Admin only)',
    usage: 'additem <name> <minimumBid> <description> <imageURL>',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event, args }) {
    const userID = event.senderID;
    // Get item details from args
    const name = args[0];
    const minimumBid = parseInt(args[1]);
    const description = args.slice(3).join(' ');
    const imageURL = args[2];

    if (!name || isNaN(minimumBid) || !description || !imageURL) {
      return api.sendMessage(
        'Usage: additem <name> <minimumBid> <imageURL> <description>\n' +
        'Example: additem "Rare Sword" 1000 https://example.com/sword.jpg "A legendary sword with magical powers"',
        event.threadID
      );
    }

    try {
      // Create new auction item
      const item = await AuctionItems.create({
        name,
        description,
        imageURL,
        minimumBid,
        ownerID: null, // Initially not owned by anyone
        isForSale: false,
        salePrice: 0,
      });

      return api.sendMessage(
        `✅ New auction item added:\n` +
        `Name: ${item.name}\n` +
        `Minimum Bid: $${item.minimumBid}\n` +
        `Description: ${item.description}\n` +
        `Item ID: ${item.id}`,
        event.threadID
      );
    } catch (error) {
      console.error('Error adding item:', error);
      return api.sendMessage('Failed to add item. Please try again.', event.threadID);
    }
  }
};