/const { AuctionItems } =     const userID = event.senderID;

    try {
      // Fi  run: async function({ api, event, args }) {
    try {
      const userID = event.senderID;
      
      if (args.length < 2) {
        return api.sendMessage(
          'Usage: additem "<name>" <minimumBid> <description>\n' +
          'Example: additem "Rare Sword" 1000 A legendary sword with magical powers\n' +
          'Attach an image or include an image URL in the description.',
          event.threadID
        );
      }

      let imageURL = null;
      
      // Check for image attachment first
      if (event.attachments && event.attachments.length > 0) {
        const attachment = event.attachments[0];
        if (attachment.type === 'photo') {
          imageURL = attachment.url;
        }
      }  const fullText = args.join(' ');
      let nameStart = fullText.indexOf('"');
      let nameEnd = fullText.indexOf('"', nameStart + 1);
      
      if (nameStart === -1 || nameEnd === -1) {
        return api.sendMessage(
          'Item name must be in quotes.\n' +
          'Usage: additem "<name>" <minimumBid> <description> (attach image or provide URL)\n' +
          'Example: additem "Rare Sword" 1000 A legendary sword with magical powers',
          event.threadID
        );
      }

      // Extract item details
      const name = fullText.substring(nameStart + 1, nameEnd).trim();
      const remainingArgs = fullText.substring(nameEnd + 1).trim().split(' ');
      
      const minimumBid = parseInt(remainingArgs[0]);
      const description = remainingArgs.slice(1).join(' ');

      // Validate basic fields
      if (!name || name.length < 1) {
        return api.sendMessage('Item name cannot be empty.', event.threadID);
      }
      
      if (isNaN(minimumBid) || minimumBid < 0) {
        return api.sendMessage('Minimum bid must be a positive number.', event.threadID);
      }

      if (!description || description.length < 1) {
        return api.sendMessage('Description cannot be empty.', event.threadID);
      }

      let imageURL = null;

      // Check for image attachment
      if (event.attachments && event.attachments.length > 0) {
        const attachment = event.attachments[0];
        if (attachment.type === 'photo') {
          imageURL = attachment.url;
        }
      }

      // If no attachment, check if URL was provided in the description
      if (!imageURL) {
        const urlMatch = description.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif))/i);
        if (urlMatch) {
          imageURL = urlMatch[0];
        }
      }

      if (!imageURL) {
        return api.sendMessage('Please provide an image by either attaching it or including an image URL in the description.', event.threadID);
      }

      // Create cache directory if it doesn't exist
      const cacheDir = path.join(__dirname, '..', '..', 'includes', 'cache');
      await fs.ensureDir(cacheDir);udes/database/models/auction");
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
  config: {
    name: 'additem',
    description: 'Add a new item to the auction system (Admin only)',
    usage: 'additem "<name>" <minimumBid> <description> (attach image or provide URL)',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event, args }) {
    const userID = event.senderID; required models
const { AuctionItems } = require("../../includes/database/models/auction");

module.exports = {
  config: {
    name: 'additem',
    description: 'Add a new item to the auction system (Admin only)',
    usage: 'additem <name> <minimumBid> <description> <imageURL>',
    cooldown: 5,
    hasPermssion: 2, // Admin only
  },
  run: async function({ api, event, args }) {
    try {
      const userID = event.senderID;
      let imageURL = null;
      
      // Check for image attachment first
      if (event.attachments && event.attachments.length > 0) {
        const attachment = event.attachments[0];
        if (attachment.type === 'photo') {
          imageURL = attachment.url;
        }
      }

    if (!name || isNaN(minimumBid) || !description || !imageURL) {
      return api.sendMessage(
        'Usage: additem <name> <minimumBid> <imageURL> <description>\n' +
        'Example: additem "Rare Sword" 1000 https://example.com/sword.jpg "A legendary sword with magical powers"',
        event.threadID
      );
    }

    try {
      // Create new auction item
                  // Save the item to database
            const { AuctionItems } = require("../../includes/database/models/auction");
            
            const item = await AuctionItems.create({
        name,
        description,
        imageURL,
        minimumBid,
        ownerID: null, // Initially not owned by anyone
        isForSale: false,
        salePrice: 0,
      });

      return api.sendMessage(
        `✅ New auction item added:\n` +
        `Name: ${item.name}\n` +
        `Minimum Bid: $${item.minimumBid}\n` +
        `Description: ${item.description}\n` +
        `Item ID: ${item.id}`,
        event.threadID
      );
    } catch (error) {
      console.error('Error adding item:', error);
      return api.sendMessage('Failed to add item. Please try again.', event.threadID);
    }
  }
};
