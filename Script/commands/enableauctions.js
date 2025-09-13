// Command: enableauctions
// Enable auction announcements in this chat (Admin only)
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'enableauctions',
    description: 'Enable auction announcements in this chat (Admin only)',
    usage: 'enableauctions',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event }) {
    const threadID = event.threadID;
    
    try {
      const configPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_threads.json');
      let threads = [];
      
      if (fs.existsSync(configPath)) {
        threads = await fs.readJson(configPath);
      }

      // Check if already enabled
      if (threads.includes(threadID)) {
        return api.sendMessage('Auctions are already enabled in this chat.', threadID);
      }

      // Enable auctions for this thread
      threads.push(threadID);
      await fs.writeJson(configPath, threads, { spaces: 2 });

      return api.sendMessage('✅ Auction announcements have been enabled in this chat.', threadID);
    } catch (error) {
      console.error('Error enabling auctions:', error);
      return api.sendMessage('Failed to enable auctions. Please try again.', threadID);
    }
  }
};