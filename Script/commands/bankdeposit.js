const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "bankdeposit",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Deposit money into your bank account",
    commandCategory: "economy",
    usages: "[amount]",
    cooldowns: 5,
    aliases: ["deposit"]
};

// Bank data storage path
const bankDataPath = path.join(__dirname, 'cache', 'bankData.json');

// Initialize bank data
function initBankData() {
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
    }
    
    if (!fs.existsSync(bankDataPath)) {
        fs.writeFileSync(bankDataPath, JSON.stringify({
            users: {},
            interestRate: 0.001, // 0.1% daily interest
            loanInterestRate: 0.005, // 0.5% daily interest on loans
            maxLoanAmount: 50000,
            lastInterestUpdate: Date.now()
        }, null, 4));
    }
    return JSON.parse(fs.readFileSync(bankDataPath, 'utf8'));
}

// Save bank data
function saveBankData(data) {
    fs.writeFileSync(bankDataPath, JSON.stringify(data, null, 4));
}

// Get user bank data
function getUserBank(userID, bankData) {
    if (!bankData.users[userID]) {
        bankData.users[userID] = {
            balance: 0,
            loan: 0,
            loanTime: 0,
            transactions: []
        };
        saveBankData(bankData);
    }
    return bankData.users[userID];
}

// Add transaction record
function addTransaction(userID, bankData, type, amount, description) {
    if (!bankData.users[userID]) getUserBank(userID, bankData);
    
    bankData.users[userID].transactions.push({
        type,
        amount,
        description,
        timestamp: Date.now()
    });
    
    // Keep only last 10 transactions
    if (bankData.users[userID].transactions.length > 10) {
        bankData.users[userID].transactions.shift();
    }
    
    saveBankData(bankData);
}

module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const bankData = initBankData();
    const userBank = getUserBank(senderID, bankData);
    
    // Get user's wallet balance
    const userData = await Currencies.getData(senderID);
    const walletBalance = userData.money || 0;
    
    // Parse deposit amount
    const amount = parseInt(args[0]);
    
    if (isNaN(amount) || amount <= 0) {
        return api.sendMessage("❌ Please enter a valid amount to deposit.", threadID, messageID);
    }
    
    if (amount > walletBalance) {
        return api.sendMessage(`❌ You don't have enough money in your wallet. Your wallet balance: $${walletBalance}`, threadID, messageID);
    }
    
    // Deduct from wallet
    await Currencies.decreaseMoney(senderID, amount);
    
    // Add to bank
    userBank.balance += amount;
    addTransaction(senderID, bankData, 'deposit', amount, 'Deposit from wallet');
    
    return api.sendMessage(
        `✅ Successfully deposited $${amount} to your bank account.\n` +
        `💰 Bank Balance: $${userBank.balance}\n` +
        `💵 Wallet Balance: $${walletBalance - amount}\n\n` +
        `💡 Your money will earn ${bankData.interestRate * 100}% interest daily!`,
        threadID, messageID
    );
};