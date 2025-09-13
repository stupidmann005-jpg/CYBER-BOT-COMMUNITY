// This code should be added to Cyber.js after the api object is created

const { AuctionItem, AuctionBid } = require('./models');
const auctionScheduler = require('./includes/auctionScheduler');
const createAuctionListener = require('./includes/auctionListener');

// Start auction scheduler after successful login
try {
  // Set up auction event listener
  const auctionListener = createAuctionListener(api);
  auctionScheduler.addListener(auctionListener);
  
  // Start scheduler
  auctionScheduler.start();
  
  console.log('[AUCTION] Auction system started successfully');
} catch(err) {
  console.error('[AUCTION] Failed to start auction system:', err);
}

// Add shutdown handler
process.on('SIGINT', async () => {
  try {
    await auctionScheduler.stop();
    console.log('[AUCTION] Auction system stopped gracefully');
  } catch(err) {
    console.error('[AUCTION] Error stopping auction system:', err); 
  }
  process.exit();
});