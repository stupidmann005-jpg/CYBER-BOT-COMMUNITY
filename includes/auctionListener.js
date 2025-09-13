// Listener for auction events that sends messages to chat
module.exports = function createAuctionListener(api) {
  return async (event, data) => {
    try {
      switch(event) {
        case 'auctionStart':
          // Send auction start announcement to all threads
          const startMsg = `🎫 New Auction Started!\n` +
                         `Item: ${data.item.name}\n` +
                         `Description: ${data.item.description}\n` +
                         `Starting Price: ${data.item.startingPrice}\n` +
                         `Time Remaining: ${Math.round(data.auctionDuration)} seconds\n\n` +
                         `Use "bid <amount>" to place a bid!`;

          for (const threadId of global.data.allThreadID) {
            await api.sendMessage(startMsg, threadId);
          }
          break;

        case 'newBid':
          // Send bid update to all threads
          const bidMsg = `New Bid!\n` +
                        `Item: ${data.itemName}\n` +
                        `Amount: ${data.amount}\n` +
                        `Bidder: ${data.bidderName}`;

          for (const threadId of global.data.allThreadID) {
            await api.sendMessage(bidMsg, threadId);
          }
          break;

        case 'auctionEnd':
          // Send auction end announcement
          const endMsg = data.winner ? 
            `🎉 Auction Ended!\n` +
            `Item: ${data.item.name}\n` +
            `Sold for: ${data.soldPrice}\n` +
            `Winner: ${data.winnerName}` :
            `Auction Ended!\n` +
            `Item: ${data.item.name}\n` +
            `No bids received`;

          for (const threadId of global.data.allThreadID) {
            await api.sendMessage(endMsg, threadId);
          }
          break;
      }
    } catch(err) {
      console.error('Error in auction listener:', err);
    }
  };
};