module.exports = {
    config: {
        name: "additem",
        version: "1.0.0",
        hasPermssion: 2,
        credits: "CyberBot",
        description: "Add a new item to the auction system",
        commandCategory: "admin",
        usages: "additem <name> <minimumBid> <description>",
        cooldowns: 5
    },

    run: async function({ api, event, args }) {
        try {
            // Check for message attachments
            let imageURL = '';
            if (event.type == "message_reply") {
                if (event.messageReply.attachments.length > 0 && event.messageReply.attachments[0].type == "photo") {
                    imageURL = event.messageReply.attachments[0].url;
                }
            } else if (event.attachments.length > 0 && event.attachments[0].type == "photo") {
                imageURL = event.attachments[0].url;
            }

            // Check arguments
            if (args.length < 3) {
                return api.sendMessage(
                    "⚠️ Invalid format!\n\n" +
                    "Usage: additem <name> <minimumBid> <description>\n" +
                    "Please attach an image or reply to an image with this command.\n\n" +
                    'Example: additem "Rare Sword" 1000 "A legendary sword with magical powers"',
                    event.threadID
                );
            }

            const name = args[0].replace(/['"]/g, ''); // Remove quotes if present
            const minimumBid = parseInt(args[1]);
            const description = args.slice(2).join(' ').replace(/['"]/g, '');

            // Validate inputs
            if (isNaN(minimumBid) || minimumBid <= 0) {
                return api.sendMessage('⚠️ Minimum bid must be a valid number greater than 0', event.threadID);
            }

            if (!imageURL) {
                return api.sendMessage('⚠️ Please attach an image or reply to an image message', event.threadID);
            }

            // Save the item to database
            const { sequelize } = require("../../includes/database");
            const AuctionItems = sequelize.model('AuctionItems');
            
            const item = await AuctionItems.create({
                name: name,
                description: description,
                imageURL: imageURL,
                minimumBid: minimumBid,
                status: 'pending',
                enabled: true
            });

            // Send confirmation with the image
            const axios = require('axios');
            const fs = require('fs-extra');
            const path = require('path');
            
            const tempImagePath = path.join(__dirname, '../../includes/cache', `auction_${Date.now()}.jpg`);
            const imageResponse = await axios.get(imageURL, { responseType: 'arraybuffer' });
            await fs.writeFile(tempImagePath, imageResponse.data);

            return api.sendMessage({
                body: `✅ Successfully added new auction item!\n\n` +
                      `Name: ${name}\n` +
                      `Minimum Bid: $${minimumBid}\n` +
                      `Description: ${description}\n` +
                      `Status: Pending auction`,
                attachment: fs.createReadStream(tempImagePath)
            }, event.threadID, async () => {
                await fs.remove(tempImagePath);
            });

        } catch (error) {
            console.error('Error in additem command:', error);
            return api.sendMessage(`❌ An error occurred: ${error.message}`, event.threadID);
        }
    }
};
