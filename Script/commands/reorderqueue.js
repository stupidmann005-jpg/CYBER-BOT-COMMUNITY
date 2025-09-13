// Command: reorderqueue
// Reorder items in the auction queue (Admin only)
const { AuctionItems } = require('../../includes/database/models');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'reorderqueue',
    description: 'Reorder items in the auction queue (Admin only)',
    usage: 'reorderqueue <itemId> <newPosition>',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event, args }) {
    const itemId = parseInt(args[0]);
    const newPosition = parseInt(args[1]);

    if (isNaN(itemId) || isNaN(newPosition) || newPosition < 1) {
      return api.sendMessage(
        'Usage: reorderqueue <itemId> <newPosition>\n' +
        'Example: reorderqueue 5 1 (moves item #5 to first position)', 
        event.threadID
      );
    }

    try {
      const queuePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_queue.json');
      if (!fs.existsSync(queuePath)) {
        return api.sendMessage('Auction queue is empty.', event.threadID);
      }

      let queue = await fs.readJson(queuePath);
      if (!queue.length) {
        return api.sendMessage('Auction queue is empty.', event.threadID);
      }

      // Find item in queue
      const currentIndex = queue.indexOf(itemId);
      if (currentIndex === -1) {
        return api.sendMessage('Item not found in queue.', event.threadID);
      }

      // Remove item from current position
      queue.splice(currentIndex, 1);

      // Insert at new position (adjust for 0-based array)
      const insertPosition = Math.min(newPosition - 1, queue.length);
      queue.splice(insertPosition, 0, itemId);

      await fs.writeJson(queuePath, queue, { spaces: 2 });

      // Get item details for the message
      const item = await AuctionItems.findByPk(itemId);
      const itemName = item ? item.name : `Item #${itemId}`;

      return api.sendMessage(
        `Moved "${itemName}" to position ${newPosition} in the queue.\n` +
        'Use showqueue to see the updated order.',
        event.threadID
      );
    } catch (error) {
      console.error('Error reordering queue:', error);
      return api.sendMessage('Failed to reorder queue. Please try again.', event.threadID);
    }
  }
};