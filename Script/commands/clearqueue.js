// Command: clearqueue
// Clear all items from the auction queue (Admin only)
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'clearqueue',
    description: 'Clear all items from the auction queue (Admin only)',
    usage: 'clearqueue',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event }) {
    try {
      const queuePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_queue.json');
      
      // Check if queue exists and has items
      if (!fs.existsSync(queuePath)) {
        return api.sendMessage('Auction queue is already empty.', event.threadID);
      }

      const queue = await fs.readJson(queuePath);
      if (!queue.length) {
        return api.sendMessage('Auction queue is already empty.', event.threadID);
      }

      // Clear the queue
      await fs.writeJson(queuePath, [], { spaces: 2 });
      return api.sendMessage(`Cleared ${queue.length} items from the auction queue.`, event.threadID);
    } catch (error) {
      console.error('Error clearing queue:', error);
      return api.sendMessage('Failed to clear queue. Please try again.', event.threadID);
    }
  }
};