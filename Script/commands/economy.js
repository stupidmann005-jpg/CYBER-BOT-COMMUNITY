module.exports.config = {
    name: "economy",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "CYBER BOT TEAM",
    description: "View all economy commands and features",
    commandCategory: "economy",
    usages: "economy",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;
    
    const message = `💰 𝗘𝗖𝗢𝗡𝗢𝗠𝗬 𝗦𝗬𝗦𝗧𝗘𝗠 𝗚𝗨𝗜𝗗𝗘 💰

` +
        `Welcome to the CYBER BOT Economy System! Here's how to manage your virtual finances:

` +
        `🏦 𝗕𝗔𝗡𝗞𝗜𝗡𝗚 𝗦𝗬𝗦𝗧𝗘𝗠:
` +
        `!bank balance - Check your bank balance and transactions
` +
        `!bank deposit [amount] - Deposit money to your bank account
` +
        `!bank withdraw [amount] - Withdraw money from your bank account
` +
        `!bank loan [amount] - Take a loan
` +
        `!bank repay [amount] - Repay your loan
` +
        `!bank interest - View current interest rates

` +
        `💵 𝗘𝗔𝗥𝗡𝗜𝗡𝗚 𝗠𝗢𝗡𝗘𝗬:
` +
        `!daily - Collect daily rewards (streak bonuses available)
` +
        `!work - Work to earn money
` +
        `!invest check - View investment opportunities
` +
        `!invest invest [option] [amount] - Invest your money

` +
        `🎮 𝗚𝗔𝗠𝗕𝗟𝗜𝗡𝗚:
` +
        `!gamble [amount] - Try your luck gambling
` +
        `!slot [amount] - Play the slot machine

` +
        `📊 𝗦𝗧𝗔𝗧𝗦 & 𝗥𝗔𝗡𝗞𝗜𝗡𝗚𝗦:
` +
        `!richest - View the richest users
` +
        `!pay [user] [amount] - Transfer money to another user

` +
        `💡 𝗧𝗜𝗣𝗦:
` +
        `• Keep money in the bank to earn daily interest
` +
        `• Maintain a daily streak for bonus rewards
` +
        `• Invest wisely based on risk tolerance
` +
        `• Repay loans quickly to avoid interest accumulation
` +
        `• The jackpot in gambling grows with each bet

` +
        `⚠️ Remember: This is a virtual economy for fun. Gambling has risks even in games!`;
    
    return api.sendMessage(message, threadID, messageID);
};