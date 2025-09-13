// Command: showqueue
// Show items in the auction queue (Admin only)
const { AuctionItems } = require('../../includes/database/models');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'showqueue',
    description: 'Show items in the auction queue (Admin only)',
    usage: 'showqueue',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event }) {
    try {
      const queuePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_queue.json');
      
      if (!fs.existsSync(queuePath)) {
        return api.sendMessage('Auction queue is empty.', event.threadID);
      }

      const queue = await fs.readJson(queuePath);
      if (!queue.length) {
        return api.sendMessage('Auction queue is empty.', event.threadID);
      }

      let msg = '📋 Auction Queue:\n\n';
      for (let i = 0; i < queue.length; i++) {
        const item = await AuctionItems.findByPk(queue[i]);
        if (item) {
          msg += `${i + 1}. ${item.name} (ID: ${item.id})\n`;
          msg += `   Min. Bid: $${item.minimumBid}\n`;
        }
      }

      return api.sendMessage(msg, event.threadID);
    } catch (error) {
      console.error('Error showing queue:', error);
      return api.sendMessage('Failed to show queue. Please try again.', event.threadID);
    }
  }
};