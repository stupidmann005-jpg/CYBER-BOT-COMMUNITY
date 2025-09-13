const fs = require('fs-extra');
const path = require('path');
const { sequelize } = require("../../includes/database/index");

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
      // Get item details from args
      const name = args[0];
      const minimumBid = parseInt(args[1]);
      const description = args.slice(2).join(' ');
      let imageURL = null;

      // Check for image attachment
      if (event.attachments && event.attachments.length > 0) {
        const attachment = event.attachments[0];
        if (attachment.type === 'photo') {
          imageURL = attachment.url;
        }
      }

      // Validate inputs
      if (!name || isNaN(minimumBid) || !description) {
        return api.sendMessage(
          '⚠️ Usage: additem2 <name> <minimumBid> <description>\n' +
          'Please attach an image when using this command.\n' +
          'Example: additem2 "Rare Sword" 1000 A legendary sword with magical powers',
          event.threadID
        );
      }

      if (!imageURL) {
        return api.sendMessage(
          '⚠️ Please attach an image to your command message.',
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
        const response = await fetch(imageURL);
        const buffer = await response.buffer();
        await fs.writeFile(imagePath, buffer);
        
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
