const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { sequelize } = require("../../includes/database/index");
const { DataTypes } = require('sequelize');

// Define AuctionItems model if it doesn't exist
const AuctionItems = sequelize.define('AuctionItems', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    imageURL: {
        type: DataTypes.STRING
    },
    minimumBid: {
        type: DataTypes.BIGINT,
        defaultValue: 100
    },
    ownerID: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = {
  config: {
    name: "additem2",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "CyberBot",
    description: "Add a new item to auction system",
    commandCategory: "auction",
    usages: "additem2 <name> <minimumBid> <description>",
    cooldowns: 5
  },
  run: async function({ api, event, args }) {
    try {
      let imageURL = null;
      
      // Check direct attachments first
      if (event.attachments && event.attachments.length > 0) {
        const attachment = event.attachments[0];
        if (attachment.type === 'photo') {
          imageURL = attachment.url;
        }
      }
      
      // If no direct attachment, check if this is a reply to a message with image
      if (!imageURL && event.messageReply) {
        const repliedMsg = event.messageReply;
        if (repliedMsg.attachments && repliedMsg.attachments.length > 0) {
          const attachment = repliedMsg.attachments[0];
          if (attachment.type === 'photo') {
            imageURL = attachment.url;
          }
        }
      }

      // Parse the command arguments
      const fullText = args.join(' ');
      
      // Find text between quotes for item name
      const nameMatch = fullText.match(/"([^"]+)"/);
      if (!nameMatch) {
        return api.sendMessage(
          '⚠️ Item name must be in quotes!\n\n' +
          'Example: /additem2 "Diamond Sword" 5000 A powerful sword\n\n' +
          'Make sure to:\n' +
          '1. Put the item name in quotes "like this"\n' +
          '2. Add a minimum bid price\n' +
          '3. Add a description\n' +
          '4. Attach an image or reply to an image',
          event.threadID
        );
      }

      const name = nameMatch[1];
      const remainingText = fullText.slice(fullText.indexOf(nameMatch[0]) + nameMatch[0].length).trim();
      const parts = remainingText.split(' ');
      const minimumBid = parseInt(parts[0]);
      const description = parts.slice(1).join(' ');

      // Validate inputs
      if (!name || name.length < 2) {
        return api.sendMessage(
          '⚠️ Please provide a valid item name in quotes!\n' +
          'Example: /additem2 "Diamond Sword" 5000 A powerful sword',
          event.threadID
        );
      }

      if (isNaN(minimumBid) || minimumBid < 1) {
        return api.sendMessage(
          '⚠️ Please provide a valid minimum bid amount!\n' +
          'Example: /additem2 "Diamond Sword" 5000 A powerful sword',
          event.threadID
        );
      }

      if (!description || description.length < 3) {
        return api.sendMessage(
          '⚠️ Please provide a description for the item!\n' +
          'Example: /additem2 "Diamond Sword" 5000 A powerful sword',
          event.threadID
        );
      }

      if (!imageURL) {
        return api.sendMessage(
          '⚠️ No image found! You can:\n\n' +
          '1. Attach an image with your command\n' +
          '   OR\n' +
          '2. Reply to a message containing an image\n\n' +
          'Example with attachment:\n' +
          '/additem2 "Diamond Sword" 5000 A powerful sword + image\n\n' +
          'Example with reply:\n' +
          '1. Send an image\n' +
          '2. Reply to it with: /additem2 "Diamond Sword" 5000 A powerful sword',
          event.threadID
        );
      }

      // Create cache directory if it doesn't exist
      const cacheDir = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction', 'images');
      await fs.ensureDir(cacheDir);

      // Download and save the image
      try {
        const imageName = `item_${Date.now()}.jpg`;
        const imagePath = path.join(cacheDir, imageName);
        
        // Download the image
        const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
        await fs.writeFile(imagePath, response.data);
        
        // Save to database with local path
        const item = await AuctionItems.create({
          name,
          description,
          imageURL: `auction/images/${imageName}`,
          minimumBid,
          ownerID: null,
          status: 'pending',
          enabled: true,
          soldPrice: 0,
          soldTo: null
        });

        // Send confirmation
        api.sendMessage(
          '✅ Item added successfully!\n' +
          `🏷️ Name: ${item.name}\n` +
          `💰 Minimum Bid: $${item.minimumBid}\n` +
          `📝 Description: ${item.description}\n` +
          `🆔 Item ID: ${item.id}`,
          event.threadID,
          async (err, info) => {
            if (!err) {
              // Send the image as a separate message
              await api.sendMessage(
                { attachment: fs.createReadStream(imagePath) },
                event.threadID
              );
            }
          }
        );
      } catch (error) {
        console.error('Error saving image:', error);
        return api.sendMessage('❌ Failed to save the image. Please try again.', event.threadID);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      return api.sendMessage('❌ Failed to add item. Please try again.', event.threadID);
    }
  }
};
