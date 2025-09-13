// Command: removequeue
// Remove an item from the auction queue (Admin only)
const { AuctionItems } = require('../../includes/database/models');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'removequeue',
    description: 'Remove an item from the auction queue (Admin only)',
    usage: 'removequeue <itemId>',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event, args }) {
    const itemId = parseInt(args[0]);
    if (isNaN(itemId)) {
      return api.sendMessage('Usage: removequeue <itemId>\nUse showqueue command to see queued items.', event.threadID);
    }

    try {
      const queuePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_queue.json');
      if (!fs.existsSync(queuePath)) {
        return api.sendMessage('Auction queue is empty.', event.threadID);
      }

      let queue = await fs.readJson(queuePath);
      const initialLength = queue.length;
      
      // Remove item from queue
      queue = queue.filter(id => id !== itemId);
      
      if (queue.length === initialLength) {
        return api.sendMessage('Item not found in queue.', event.threadID);
      }

      await fs.writeJson(queuePath, queue, { spaces: 2 });
      
      // Get item details for the message
      const item = await AuctionItems.findByPk(itemId);
      const itemName = item ? item.name : `Item #${itemId}`;
      
      return api.sendMessage(`Removed "${itemName}" from the auction queue.`, event.threadID);
    } catch (error) {
      console.error('Error removing from queue:', error);
      return api.sendMessage('Failed to remove item from queue. Please try again.', event.threadID);
    }
  }
};