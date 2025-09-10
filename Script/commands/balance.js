const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "balance",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Check your balance",
    commandCategory: "economy",
    usages: "[user tag]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID, mentions } = event;
    
    // Check if user mentioned someone
    let targetID = senderID;
    let mentionName = "Your";
    
    if (Object.keys(mentions).length > 0) {
        const mentionID = Object.keys(mentions)[0];
        targetID = mentionID;
        mentionName = await Users.getNameUser(mentionID);
        mentionName = mentionName + "'s";
    }
    
    // Get user's wallet balance
    const userData = await Currencies.getData(targetID);
    const walletBalance = userData.money || 0;
    
    // Send balance message
    return api.sendMessage(
        `💰 ${mentionName} Balance 💰\n\n` +
        `💵 Wallet: $${walletBalance}\n\n` +
        `💡 Tip: Use !bank deposit [amount] to deposit money in the bank and earn interest!`,
        threadID, messageID
    );
};