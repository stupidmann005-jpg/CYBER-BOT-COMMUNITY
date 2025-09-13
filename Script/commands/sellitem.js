// Command: sellitem
// List an owned item for sale at a specified price
const { AuctionItems } = require('../../includes/database/models');

module.exports = {
  config: {
    name: 'sellitem',
    description: 'Sell an owned item at a specified price',
    usage: 'sellitem <itemId> <price>',
    cooldown: 5,
  },
  run: async function({ api, event, args }) {
    const userID = event.senderID;
    const itemId = parseInt(args[0]);
    const price = parseInt(args[1]);
    if (isNaN(itemId) || isNaN(price) || price <= 0) return api.sendMessage('Usage: sellitem <itemId> <price>', event.threadID);
    const item = await AuctionItems.findByPk(itemId);
    if (!item || item.ownerID !== userID) return api.sendMessage('You do not own this item.', event.threadID);
    item.isForSale = true;
    item.salePrice = price;
    await item.save();
    api.sendMessage(`Item '${item.name}' is now listed for sale at $${price}.`, event.threadID);
  }
};
