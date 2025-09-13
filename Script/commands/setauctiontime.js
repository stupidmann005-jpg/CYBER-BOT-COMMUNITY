// Command: setauctiontime
// Set the duration for auctions (Admin only)
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'setauctiontime',
    description: 'Set the duration for auctions in minutes (Admin only)',
    usage: 'setauctiontime <minutes>',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event, args }) {
    const minutes = parseInt(args[0]);
    
    if (isNaN(minutes) || minutes < 1) {
      return api.sendMessage(
        'Usage: setauctiontime <minutes>\n' +
        'Example: setauctiontime 5 (sets auction duration to 5 minutes)',
        event.threadID
      );
    }

    try {
      const configPath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction_config.json');
      const config = {
        auctionDurationMinutes: minutes
      };
      
      await fs.writeJson(configPath, config, { spaces: 2 });
      return api.sendMessage(
        `✅ Auction duration has been set to ${minutes} minute${minutes === 1 ? '' : 's'}.\n` +
        'This will apply to new auctions starting from now.',
        event.threadID
      );
    } catch (error) {
      console.error('Error setting auction time:', error);
      return api.sendMessage('Failed to set auction duration. Please try again.', event.threadID);
    }
  }
};