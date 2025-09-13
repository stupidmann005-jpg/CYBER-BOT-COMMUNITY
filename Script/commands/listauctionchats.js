// Command: listauctionchats
// List all chats where auctions are enabled (Admin only)
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'listauctionchats',
    description: 'List all chats where auctions are enabled (Admin only)',
    usage: 'listauctionchats',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event }) {
    try {
      const configPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_threads.json');
      if (!fs.existsSync(configPath)) {
        return api.sendMessage('No chats have auctions enabled.', event.threadID);
      }

      const threads = await fs.readJson(configPath);
      if (!threads.length) {
        return api.sendMessage('No chats have auctions enabled.', event.threadID);
      }

      let msg = '📢 Auction-Enabled Chats:\n\n';
      for (const threadID of threads) {
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          msg += `- ${threadInfo.threadName || 'Unknown Group'} (${threadID})\n`;
        } catch (error) {
          msg += `- Unknown Group (${threadID})\n`;
        }
      }

      return api.sendMessage(msg, event.threadID);
    } catch (error) {
      console.error('Error listing auction chats:', error);
      return api.sendMessage('Failed to list auction chats. Please try again.', event.threadID);
    }
  }
};