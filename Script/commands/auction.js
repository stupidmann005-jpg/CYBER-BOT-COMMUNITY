// Command: auction
// Shows current auction item with image, details, and minimum price
const { Auctions, AuctionItems } = require('../../includes/database/models');

module.exports = {
  config: {
    name: 'auction',
    description: 'Show current auction item',
    usage: 'auction',
    cooldown: 5,
  },
  run: async function({ api, event }) {
    // Find active auction
    const auction = await Auctions.findOne({ where: { status: 'active' } });
    if (!auction) return api.sendMessage('No auction is currently running.', event.threadID);
    const item = await AuctionItems.findByPk(auction.currentItemId);
    if (!item) return api.sendMessage('Auction item not found.', event.threadID);
    let msg = `🛒 Auction Item: ${item.name}\n`;
    msg += `Description: ${item.description}\n`;
    msg += `Minimum Bid: $${item.minimumBid}\n`;
    msg += `Auction Ends: ${auction.currentAuctionEnd}\n`;
    if (item.imageURL) {
      // Send image with details
      api.sendMessage({ body: msg, attachment: await global.utils.getStreamFromURL(item.imageURL) }, event.threadID);
    } else {
      api.sendMessage(msg, event.threadID);
    }
  }
};
