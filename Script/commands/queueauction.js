// Command: queueauction
// Queue an item for the next auctions (Admin only)
const { AuctionItems } = require('../../includes/database/models');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'queueauction',
    description: 'Add an item to the auction queue (Admin only)',
    usage: 'queueauction <itemId>',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event, args }) {
    const itemId = parseInt(args[0]);
    if (isNaN(itemId)) {
      return api.sendMessage('Usage: queueauction <itemId>\nUse listitems command to see available items.', event.threadID);
    }

    try {
      // Check if item exists
      const item = await AuctionItems.findByPk(itemId);
      if (!item) {
        return api.sendMessage('Item not found.', event.threadID);
      }

      // Load or create auction queue
      const queuePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_queue.json');
      let queue = [];
      
      if (fs.existsSync(queuePath)) {
        queue = await fs.readJson(queuePath);
      }

      // Add item to queue if not already queued
      if (!queue.includes(itemId)) {
        queue.push(itemId);
        await fs.writeJson(queuePath, queue, { spaces: 2 });
        return api.sendMessage(`Item "${item.name}" has been added to the auction queue.`, event.threadID);
      } else {
        return api.sendMessage(`Item "${item.name}" is already in the auction queue.`, event.threadID);
      }
    } catch (error) {
      console.error('Error queueing auction:', error);
      return api.sendMessage('Failed to queue item. Please try again.', event.threadID);
    }
  }
};