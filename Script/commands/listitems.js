// Command: listitems
// List all items in the auction system
const { AuctionItems } = require('../../includes/database/models');

module.exports = {
  config: {
    name: 'listitems',
    description: 'List all items in the auction system',
    usage: 'listitems',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event }) {
    try {
      const items = await AuctionItems.findAll();
      if (!items.length) {
        return api.sendMessage('No items in the auction system.', event.threadID);
      }

      let msg = '📦 Auction Items:\n\n';
      for (const item of items) {
        msg += `ID: ${item.id}\n`;
        msg += `Name: ${item.name}\n`;
        msg += `Minimum Bid: $${item.minimumBid}\n`;
        msg += `Owner: ${item.ownerID || 'None'}\n`;
        msg += `For Sale: ${item.isForSale ? 'Yes' : 'No'}\n`;
        if (item.isForSale) msg += `Sale Price: $${item.salePrice}\n`;
        msg += '───────────────\n';
      }

      return api.sendMessage(msg, event.threadID);
    } catch (error) {
      console.error('Error listing items:', error);
      return api.sendMessage('Failed to list items. Please try again.', event.threadID);
    }
  }
};