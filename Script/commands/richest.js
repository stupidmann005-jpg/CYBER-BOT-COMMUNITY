const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "richest",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "CYBER BOT TEAM",
    description: "View the richest users in the system",
    commandCategory: "economy",
    usages: "richest [page]",
    cooldowns: 5
};

// Initialize bank data on bot load
module.exports.onLoad = function() {
    const fs = require('fs-extra');
    const path = require('path');
    
    // Ensure cache directory exists
    const cachePath = path.join(__dirname, 'cache');
    if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath, { recursive: true });
    }
}

// Bank data storage path
const bankDataPath = path.join(__dirname, 'cache', 'bankData.json');

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID } = event;
    const page = parseInt(args[0]) || 1;
    const limit = 10; // Users per page
    const skip = (page - 1) * limit;
    
    try {
        // Get all users with money data
        let allUsers = await Currencies.getAll(['userID', 'money']);
        
        // Load bank data if exists
        let bankData = { users: {} };
        if (fs.existsSync(bankDataPath)) {
            try {
                bankData = JSON.parse(fs.readFileSync(bankDataPath, 'utf8'));
            } catch (err) {
                console.error("Error reading bank data:", err);
            }
        }
        
        // Combine wallet and bank balances
        const combinedData = allUsers.map(user => {
            const userID = user.userID;
            const walletBalance = user.money || 0;
            const bankBalance = bankData.users[userID]?.balance || 0;
            const totalMoney = walletBalance + bankBalance;
            
            return {
                userID,
                walletBalance,
                bankBalance,
                totalMoney
            };
        });
        
        // Sort by total money (descending)
        combinedData.sort((a, b) => b.totalMoney - a.totalMoney);
        
        // Get users for current page
        const usersOnPage = combinedData.slice(skip, skip + limit);
        
        // No users found
        if (usersOnPage.length === 0) {
            return api.sendMessage(`❌ No users found or invalid page number.`, threadID, messageID);
        }
        
        // Build leaderboard message
        let msg = `💰 𝗥𝗜𝗖𝗛𝗘𝗦𝗧 𝗨𝗦𝗘𝗥𝗦 💰\n\n`;
        
        // Get user names and build message
        for (let i = 0; i < usersOnPage.length; i++) {
            const userData = usersOnPage[i];
            const rank = skip + i + 1;
            let userName = "Facebook User";
            
            try {
                const userInfo = await Users.getInfo(userData.userID);
                userName = userInfo.name || "Facebook User";
            } catch (err) {
                console.error(`Error getting user info for ${userData.userID}:`, err);
            }
            
            // Add crown emoji for top 3
            let rankEmoji = "";
            if (rank === 1) rankEmoji = "👑 ";
            else if (rank === 2) rankEmoji = "🥈 ";
            else if (rank === 3) rankEmoji = "🥉 ";
            
            msg += `${rankEmoji}${rank}. ${userName}\n`;
            msg += `   💵 Wallet: $${userData.walletBalance.toLocaleString()}\n`;
            msg += `   🏦 Bank: $${userData.bankBalance.toLocaleString()}\n`;
            msg += `   💰 Total: $${userData.totalMoney.toLocaleString()}\n\n`;
        }
        
        // Add pagination info
        const totalPages = Math.ceil(combinedData.length / limit);
        msg += `📄 Page ${page}/${totalPages} | Total Users: ${combinedData.length}\n`;
        msg += `💡 Use !richest [page] to view more users\n`;
        msg += `💡 Use !bank and !invest to grow your wealth!`;
        
        return api.sendMessage(msg, threadID, messageID);
    } catch (error) {
        console.error(error);
        return api.sendMessage(`❌ An error occurred: ${error.message}`, threadID, messageID);
    }
};
