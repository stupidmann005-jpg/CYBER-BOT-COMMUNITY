const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

module.exports.config = {
    name: "daily",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "CYBER BOT TEAM",
    description: "Collect daily rewards",
    commandCategory: "economy",
    usages: "daily",
    cooldowns: 5,
    envConfig: {
        cooldownTime: 86400000, // 24 hours in milliseconds
        rewardAmount: 1000 // Default reward amount
    }
};

// Daily rewards data storage path
const dailyDataPath = path.join(__dirname, 'cache', 'dailyData.json');

// Initialize daily data
function initDailyData() {
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
    }
    
    if (!fs.existsSync(dailyDataPath)) {
        fs.writeFileSync(dailyDataPath, JSON.stringify({
            users: {},
            streakBonus: {
                3: 100,  // 3 days streak: +100 bonus
                7: 300,  // 7 days streak: +300 bonus
                14: 700, // 14 days streak: +700 bonus
                30: 1500 // 30 days streak: +1500 bonus
            }
        }, null, 4));
    }
    return JSON.parse(fs.readFileSync(dailyDataPath, 'utf8'));
}

// Save daily data
function saveDailyData(data) {
    fs.writeFileSync(dailyDataPath, JSON.stringify(data, null, 4));
}

// Get user daily data
function getUserDaily(userID, dailyData) {
    if (!dailyData.users[userID]) {
        dailyData.users[userID] = {
            lastClaim: 0,
            streak: 0,
            totalClaims: 0
        };
        saveDailyData(dailyData);
    }
    return dailyData.users[userID];
}

module.exports.run = async function({ api, event, args, Currencies, envConfig }) {
    const { threadID, messageID, senderID } = event;
    const dailyData = initDailyData();
    const userData = getUserDaily(senderID, dailyData);
    
    const now = Date.now();
    const cooldownTime = envConfig.cooldownTime || 86400000; // 24 hours in milliseconds
    const baseReward = envConfig.rewardAmount || 1000;
    
    // Check if user can claim daily reward
    if (now - userData.lastClaim < cooldownTime) {
        const timeLeft = cooldownTime - (now - userData.lastClaim);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        return api.sendMessage(`⏰ You have already claimed your daily reward. Please wait ${hours}h ${minutes}m ${seconds}s before claiming again.`, threadID, messageID);
    }
    
    // Check if streak should continue or reset
    const oneDayMs = 24 * 60 * 60 * 1000;
    const twoDaysMs = 2 * oneDayMs;
    
    // If last claim was more than 2 days ago, reset streak
    if (now - userData.lastClaim > twoDaysMs) {
        userData.streak = 1; // Reset to 1 (today's claim)
    } 
    // If last claim was between 1-2 days ago, continue streak
    else if (now - userData.lastClaim >= oneDayMs) {
        userData.streak += 1;
    }
    // This shouldn't happen due to cooldown check above, but just in case
    else {
        return api.sendMessage(`⏰ You have already claimed your daily reward today.`, threadID, messageID);
    }
    
    // Update user data
    userData.lastClaim = now;
    userData.totalClaims += 1;
    saveDailyData(dailyData);
    
    // Calculate reward with streak bonus
    let reward = baseReward;
    let bonusMessage = "";
    
    // Check for streak bonuses
    const streakBonuses = dailyData.streakBonus;
    for (const days in streakBonuses) {
        if (userData.streak === parseInt(days)) {
            const bonus = streakBonuses[days];
            reward += bonus;
            bonusMessage = `\n🎉 ${days}-day streak bonus: +$${bonus}!`;
            break;
        }
    }
    
    // Add small continuous streak bonus (5% per day, up to 100%)
    const streakMultiplier = Math.min(1, userData.streak * 0.05);
    const streakBonus = Math.floor(baseReward * streakMultiplier);
    reward += streakBonus;
    
    if (streakBonus > 0 && !bonusMessage) {
        bonusMessage = `\n🔥 Streak bonus: +$${streakBonus}!`;
    }
    
    // Add reward to user's wallet
    await Currencies.increaseMoney(senderID, reward);
    
    // Get updated balance
    const userMoney = await Currencies.getData(senderID);
    const balance = userMoney.money || 0;
    
    // Send success message
    return api.sendMessage(
        `💰 Daily Reward Collected! 💰\n` +
        `\n💵 Amount: $${reward}${bonusMessage}` +
        `\n🔄 Current streak: ${userData.streak} day(s)` +
        `\n📊 Total claims: ${userData.totalClaims}` +
        `\n💰 Current balance: $${balance}` +
        `\n\n💡 Tip: Deposit your money in the bank using !bank deposit [amount] to earn interest!`,
        threadID, messageID
    );
};