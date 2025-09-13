// Command: buyitem
// Buy an item listed for sale
const { AuctionItems, Users } = require('../../includes/database/models');

module.exports = {
  config: {
    name: 'buyitem',
    description: 'Buy an item listed for sale',
    usage: 'buyitem <itemId>',
    cooldown: 5,
  },
  run: async function({ api, event, args }) {
    const userID = event.senderID;
    const itemId = parseInt(args[0]);
    if (isNaN(itemId)) return api.sendMessage('Usage: buyitem <itemId>', event.threadID);
    const item = await AuctionItems.findByPk(itemId);
    if (!item || !item.isForSale) return api.sendMessage('Item is not for sale.', event.threadID);
    if (item.ownerID === userID) return api.sendMessage('You already own this item.', event.threadID);
    // Check buyer's wallet
    const buyer = await Users.findByPk(userID);
    if (!buyer || buyer.wallet < item.salePrice) return api.sendMessage('Insufficient wallet balance.', event.threadID);
    // Transfer ownership
    buyer.wallet -= item.salePrice;
    await buyer.save();
    item.ownerID = userID;
    item.isForSale = false;
    await item.save();
    api.sendMessage(`You have bought '${item.name}' for $${item.salePrice}.`, event.threadID);
  }
};
