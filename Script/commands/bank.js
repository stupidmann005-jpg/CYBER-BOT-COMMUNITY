const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

module.exports.config = {
    name: "bank",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "CYBER BOT TEAM",
    description: "Banking system with balance, earn, withdraw, and loan features",
    commandCategory: "economy",
    usages: "[check/balance/deposit/withdraw/loan/repay/interest/help] [amount]",
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
    
    // Initialize bank data file if it doesn't exist
    const bankDataPath = path.join(cachePath, 'bankData.json');
    if (!fs.existsSync(bankDataPath)) {
        fs.writeFileSync(bankDataPath, JSON.stringify({
            users: {},
            interestRate: 0.05, // 5% interest rate
            loanInterestRate: 0.1, // 10% loan interest rate
            maxLoanAmount: 10000, // Maximum loan amount
            lastInterestUpdate: Date.now()
        }, null, 4));
    }
}

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
            interestRate: 0.05, // 5% interest rate
            loanInterestRate: 0.1, // 10% loan interest rate
            maxLoanAmount: 10000, // Maximum loan amount
            lastInterestUpdate: Date.now()
        }, null, 4));
    }
    return JSON.parse(fs.readFileSync(bankDataPath, 'utf8'));
}

// Save bank data
function saveBankData(data) {
    fs.writeFileSync(bankDataPath, JSON.stringify(data, null, 4));
}

// Get user bank account
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
    const user = getUserBank(userID, bankData);
    user.transactions.push({
        type,
        amount,
        description,
        timestamp: Date.now()
    });
    
    // Keep only last 10 transactions
    if (user.transactions.length > 10) {
        user.transactions.shift();
    }
    
    saveBankData(bankData);
}

// Calculate interest (runs daily)
function calculateInterest(bankData) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Only calculate interest once per day
    if (now - bankData.lastInterestUpdate >= oneDayMs) {
        for (const userID in bankData.users) {
            const user = bankData.users[userID];
            
            // Add interest to balance
            if (user.balance > 0) {
                const interest = Math.floor(user.balance * bankData.interestRate);
                user.balance += interest;
                addTransaction(userID, bankData, 'interest', interest, 'Daily interest');
            }
            
            // Add interest to loan
            if (user.loan > 0) {
                const loanInterest = Math.floor(user.loan * bankData.loanInterestRate);
                user.loan += loanInterest;
                addTransaction(userID, bankData, 'loan_interest', loanInterest, 'Loan interest');
            }
        }
        
        bankData.lastInterestUpdate = now;
        saveBankData(bankData);
    }
}

module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const bankData = initBankData();
    const userBank = getUserBank(senderID, bankData);
    
    // Calculate interest
    calculateInterest(bankData);
    
    // Get user's wallet balance
    const userData = await Currencies.getData(senderID);
    const walletBalance = userData.money || 0;
    
    const command = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    
    switch (command) {
        case "check":
        case "balance":
            // Show bank balance and loan status
            let replyMsg = `💰 𝗕𝗔𝗡𝗞 𝗔𝗖𝗖𝗢𝗨𝗡𝗧 💰\n\n`;
            replyMsg += `👤 User ID: ${senderID}\n`;
            replyMsg += `💵 Wallet Balance: $${walletBalance}\n`;
            replyMsg += `🏦 Bank Balance: $${userBank.balance}\n`;
            
            if (userBank.loan > 0) {
                const loanTime = moment(userBank.loanTime).tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
                replyMsg += `🔴 Outstanding Loan: $${userBank.loan}\n`;
                replyMsg += `⏰ Loan Date: ${loanTime}\n`;
            }
            
            replyMsg += `\n📊 Recent Transactions:\n`;
            if (userBank.transactions.length > 0) {
                userBank.transactions.slice(-5).forEach((transaction, index) => {
                    const time = moment(transaction.timestamp).tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A");
                    replyMsg += `${index + 1}. ${transaction.type}: $${transaction.amount} - ${transaction.description} (${time})\n`;
                });
            } else {
                replyMsg += `No recent transactions.\n`;
            }
            
            return api.sendMessage(replyMsg, threadID, messageID);
            
        case "deposit":
            // Deposit money to bank
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
            
            return api.sendMessage(`✅ Successfully deposited $${amount} to your bank account.\n💰 Bank Balance: $${userBank.balance}\n💵 Wallet Balance: $${walletBalance - amount}`, threadID, messageID);
            
        case "withdraw":
            // Withdraw money from bank
            if (isNaN(amount) || amount <= 0) {
                return api.sendMessage("❌ Please enter a valid amount to withdraw.", threadID, messageID);
            }
            
            if (amount > userBank.balance) {
                return api.sendMessage(`❌ You don't have enough money in your bank account. Your bank balance: $${userBank.balance}`, threadID, messageID);
            }
            
            // Deduct from bank
            userBank.balance -= amount;
            addTransaction(senderID, bankData, 'withdraw', amount, 'Withdraw to wallet');
            
            // Add to wallet
            await Currencies.increaseMoney(senderID, amount);
            
            return api.sendMessage(`✅ Successfully withdrew $${amount} from your bank account.\n💰 Bank Balance: $${userBank.balance}\n💵 Wallet Balance: $${walletBalance + amount}`, threadID, messageID);
            
        case "loan":
            // Take a loan
            if (isNaN(amount) || amount <= 0) {
                return api.sendMessage("❌ Please enter a valid amount to loan.", threadID, messageID);
            }
            
            if (userBank.loan > 0) {
                return api.sendMessage(`❌ You already have an outstanding loan of $${userBank.loan}. Please repay it first.`, threadID, messageID);
            }
            
            if (amount > bankData.maxLoanAmount) {
                return api.sendMessage(`❌ The maximum loan amount is $${bankData.maxLoanAmount}.`, threadID, messageID);
            }
            
            // Add loan
            userBank.loan = amount;
            userBank.loanTime = Date.now();
            addTransaction(senderID, bankData, 'loan', amount, 'Loan taken');
            
            // Add to wallet
            await Currencies.increaseMoney(senderID, amount);
            
            return api.sendMessage(`✅ Successfully took a loan of $${amount}.\n⚠️ Interest Rate: ${bankData.loanInterestRate * 100}% per day\n💵 Wallet Balance: $${walletBalance + amount}\n🔴 Outstanding Loan: $${userBank.loan}`, threadID, messageID);
            
        case "repay":
            // Repay loan
            if (userBank.loan <= 0) {
                return api.sendMessage("❌ You don't have any outstanding loans.", threadID, messageID);
            }
            
            if (isNaN(amount) || amount <= 0) {
                return api.sendMessage("❌ Please enter a valid amount to repay.", threadID, messageID);
            }
            
            if (amount > walletBalance) {
                return api.sendMessage(`❌ You don't have enough money in your wallet. Your wallet balance: $${walletBalance}`, threadID, messageID);
            }
            
            const repayAmount = Math.min(amount, userBank.loan);
            
            // Deduct from wallet
            await Currencies.decreaseMoney(senderID, repayAmount);
            
            // Reduce loan
            userBank.loan -= repayAmount;
            addTransaction(senderID, bankData, 'repay', repayAmount, 'Loan repayment');
            
            if (userBank.loan <= 0) {
                userBank.loanTime = 0;
                return api.sendMessage(`✅ Congratulations! You've fully repaid your loan.\n💵 Wallet Balance: $${walletBalance - repayAmount}`, threadID, messageID);
            } else {
                return api.sendMessage(`✅ You've repaid $${repayAmount} of your loan.\n🔴 Remaining Loan: $${userBank.loan}\n💵 Wallet Balance: $${walletBalance - repayAmount}`, threadID, messageID);
            }
            
        case "interest":
            // Show interest rates
            return api.sendMessage(`📊 𝗕𝗔𝗡𝗞 𝗜𝗡𝗧𝗘𝗥𝗘𝗦𝗧 𝗥𝗔𝗧𝗘𝗦\n\n💰 Savings Interest: ${bankData.interestRate * 100}% per day\n🔴 Loan Interest: ${bankData.loanInterestRate * 100}% per day\n💵 Maximum Loan: $${bankData.maxLoanAmount}`, threadID, messageID);
            
        case "help":
        default:
            // Show help
            return api.sendMessage(`💰 𝗕𝗔𝗡𝗞 𝗦𝗬𝗦𝗧𝗘𝗠 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦\n\n!bank balance - Check your bank balance and transactions\n!bank deposit [amount] - Deposit money to your bank account\n!bank withdraw [amount] - Withdraw money from your bank account\n!bank loan [amount] - Take a loan\n!bank repay [amount] - Repay your loan\n!bank interest - View current interest rates\n!bank help - Show this help message\n\n💡 Your money earns interest daily when stored in the bank!\n⚠️ Loans also accumulate interest daily, so repay them quickly!`, threadID, messageID);
    }
};
