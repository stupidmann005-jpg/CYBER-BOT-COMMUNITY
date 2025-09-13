// Command: disableauctions
// Disable auction announcements in this chat (Admin only)
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'disableauctions',
    description: 'Disable auction announcements in this chat (Admin only)',
    usage: 'disableauctions',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event }) {
    const threadID = event.threadID;
    
    try {
      const configPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_threads.json');
      if (!fs.existsSync(configPath)) {
        return api.sendMessage('Auctions are already disabled in this chat.', threadID);
      }

      let threads = await fs.readJson(configPath);
      
      // Check if already disabled
      if (!threads.includes(threadID)) {
        return api.sendMessage('Auctions are already disabled in this chat.', threadID);
      }

      // Disable auctions for this thread
      threads = threads.filter(id => id !== threadID);
      await fs.writeJson(configPath, threads, { spaces: 2 });

      return api.sendMessage('❌ Auction announcements have been disabled in this chat.', threadID);
    } catch (error) {
      console.error('Error disabling auctions:', error);
      return api.sendMessage('Failed to disable auctions. Please try again.', threadID);
    }
  }
};