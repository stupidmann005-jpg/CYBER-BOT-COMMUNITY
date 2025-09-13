const fs = require('fs-extra');
const path = require('path');
const { sequelize } = require("../../includes/database/index");
const { DataTypes } = require('sequelize');

// Define AuctionItems model
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
    status: {
        type: DataTypes.ENUM('pending', 'active', 'sold'),
        defaultValue: 'pending'
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports.config = {
    name: "aqueue",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "View all pending items in the auction queue",
    commandCategory: "economy",
    usages: "",
    cooldowns: 5,
    envConfig: {
        //no config needed
    }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
        // Get all pending items
        const pendingItems = await AuctionItems.findAll({
            where: {
                status: 'pending',
                enabled: true
            },
            order: [['createdAt', 'ASC']]
        });

        if (pendingItems.length === 0) {
            return api.sendMessage("📦 No items are pending for auction.", threadID, messageID);
        }

        // Create a nicely formatted list
        let message = "📋 Auction Queue:\n\n";
        
        for (let i = 0; i < pendingItems.length; i++) {
            const item = pendingItems[i];
            message += `${i + 1}. ${item.name}\n`;
            message += `   💰 Minimum Bid: $${item.minimumBid}\n`;
            message += `   📝 Description: ${item.description}\n`;
            message += `   🆔 Item ID: ${item.id}\n`;
            if (i < pendingItems.length - 1) message += "\n";
        }

        message += "\nℹ️ These items will be auctioned automatically in order.";

        // Send the message with messageID
        api.sendMessage(message, threadID, messageID);

    } catch (error) {
        console.error("Error in aqueue command:", error);
        return api.sendMessage("❌ An error occurred while getting pending items.", threadID, messageID);
    }
};