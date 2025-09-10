const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

module.exports.config = {
    name: "invest",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "CYBER BOT TEAM",
    description: "Invest your money for potential returns",
    commandCategory: "economy",
    usages: "[check/invest/withdraw/help] [amount/id]",
    cooldowns: 5
};

// Investment data storage path
const investDataPath = path.join(__dirname, 'cache', 'investData.json');

// Initialize investment data
function initInvestData() {
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
    }
    
    if (!fs.existsSync(investDataPath)) {
        fs.writeFileSync(investDataPath, JSON.stringify({
            users: {},
            options: [
                {
                    id: "stocks",
                    name: "Stock Market",
                    minAmount: 1000,
                    duration: 86400000, // 24 hours
                    riskLevel: "medium",
                    minReturn: -0.2, // Can lose up to 20%
                    maxReturn: 0.4, // Can gain up to 40%
                    description: "Invest in the stock market with medium risk and potential returns."
                },
                {
                    id: "crypto",
                    name: "Cryptocurrency",
                    minAmount: 2000,
                    duration: 172800000, // 48 hours
                    riskLevel: "high",
                    minReturn: -0.5, // Can lose up to 50%
                    maxReturn: 1.0, // Can gain up to 100%
                    description: "High risk, high reward cryptocurrency investments."
                },
                {
                    id: "business",
                    name: "Small Business",
                    minAmount: 5000,
                    duration: 259200000, // 72 hours
                    riskLevel: "low",
                    minReturn: -0.05, // Can lose up to 5%
                    maxReturn: 0.25, // Can gain up to 25%
                    description: "Invest in small businesses with lower risk and steady returns."
                },
                {
                    id: "realestate",
                    name: "Real Estate",
                    minAmount: 10000,
                    duration: 604800000, // 7 days
                    riskLevel: "very low",
                    minReturn: 0.05, // Minimum 5% return
                    maxReturn: 0.15, // Maximum 15% return
                    description: "Safe investment in real estate with guaranteed returns."
                }
            ]
        }, null, 4));
    }
    return JSON.parse(fs.readFileSync(investDataPath, 'utf8'));
}

// Save investment data
function saveInvestData(data) {
    fs.writeFileSync(investDataPath, JSON.stringify(data, null, 4));
}

// Get user investments
function getUserInvestments(userID, investData) {
    if (!investData.users[userID]) {
        investData.users[userID] = {
            investments: [],
            history: []
        };
        saveInvestData(investData);
    }
    return investData.users[userID];
}

// Add investment history
function addInvestmentHistory(userID, investData, type, amount, result, description) {
    const user = getUserInvestments(userID, investData);
    user.history.push({
        type,
        amount,
        result,
        description,
        timestamp: Date.now()
    });
    
    // Keep only last 10 history entries
    if (user.history.length > 10) {
        user.history.shift();
    }
    
    saveInvestData(investData);
}

// Calculate investment return
function calculateReturn(investment, option) {
    // Random return between min and max
    const returnRate = option.minReturn + Math.random() * (option.maxReturn - option.minReturn);
    const returnAmount = Math.floor(investment.amount * returnRate);
    
    return {
        originalAmount: investment.amount,
        returnAmount: returnAmount,
        totalReturn: investment.amount + returnAmount,
        returnRate: returnRate
    };
}

module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const investData = initInvestData();
    const userInvestments = getUserInvestments(senderID, investData);
    
    // Get user's wallet balance
    const userData = await Currencies.getData(senderID);
    const walletBalance = userData.money || 0;
    
    const command = args[0]?.toLowerCase();
    const param = args[1];
    
    switch (command) {
        case "check":
            // Show active investments and options
            let replyMsg = `💹 𝗜𝗡𝗩𝗘𝗦𝗧𝗠𝗘𝗡𝗧 𝗣𝗢𝗥𝗧𝗙𝗢𝗟𝗜𝗢 💹\n\n`;
            replyMsg += `👤 User ID: ${senderID}\n`;
            replyMsg += `💵 Wallet Balance: $${walletBalance}\n\n`;
            
            // Active investments
            replyMsg += `📊 𝗔𝗖𝗧𝗜𝗩𝗘 𝗜𝗡𝗩𝗘𝗦𝗧𝗠𝗘𝗡𝗧𝗦:\n`;
            if (userInvestments.investments.length > 0) {
                userInvestments.investments.forEach((investment, index) => {
                    const option = investData.options.find(opt => opt.id === investment.optionId);
                    const maturityDate = moment(investment.timestamp + option.duration).tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A");
                    const now = Date.now();
                    const timeLeft = investment.timestamp + option.duration - now;
                    
                    if (timeLeft > 0) {
                        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                        
                        replyMsg += `${index + 1}. ${option.name}: $${investment.amount}\n`;
                        replyMsg += `   ⏰ Matures: ${maturityDate} (${hoursLeft}h ${minutesLeft}m left)\n`;
                        replyMsg += `   🔄 ID: ${investment.id}\n`;
                    }
                });
            } else {
                replyMsg += `You have no active investments.\n`;
            }
            
            // Investment options
            replyMsg += `\n💰 𝗜𝗡𝗩𝗘𝗦𝗧𝗠𝗘𝗡𝗧 𝗢𝗣𝗧𝗜𝗢𝗡𝗦:\n`;
            investData.options.forEach((option, index) => {
                replyMsg += `${index + 1}. ${option.name} (${option.id})\n`;
                replyMsg += `   💵 Min: $${option.minAmount} | ⏰ Duration: ${option.duration / (24 * 60 * 60 * 1000)} days\n`;
                replyMsg += `   📊 Risk: ${option.riskLevel} | 📈 Return: ${Math.round(option.minReturn * 100)}% to ${Math.round(option.maxReturn * 100)}%\n`;
            });
            
            // Recent history
            replyMsg += `\n📜 𝗥𝗘𝗖𝗘𝗡𝗧 𝗛𝗜𝗦𝗧𝗢𝗥𝗬:\n`;
            if (userInvestments.history.length > 0) {
                userInvestments.history.slice(-5).forEach((record, index) => {
                    const time = moment(record.timestamp).tz("Asia/Dhaka").format("DD/MM/YYYY");
                    replyMsg += `${index + 1}. ${record.type}: $${record.amount} → $${record.result} (${time})\n`;
                });
            } else {
                replyMsg += `No investment history.\n`;
            }
            
            return api.sendMessage(replyMsg, threadID, messageID);
            
        case "invest":
            // Invest in an option
            if (!param) {
                return api.sendMessage("❌ Please specify an investment option ID (stocks, crypto, business, realestate).", threadID, messageID);
            }
            
            const optionId = param.toLowerCase();
            const option = investData.options.find(opt => opt.id === optionId);
            
            if (!option) {
                return api.sendMessage("❌ Invalid investment option. Use !invest check to see available options.", threadID, messageID);
            }
            
            const amount = parseInt(args[2]);
            
            if (isNaN(amount) || amount < option.minAmount) {
                return api.sendMessage(`❌ Please enter a valid amount (minimum $${option.minAmount} for ${option.name}).", threadID, messageID);
            }
            
            if (amount > walletBalance) {
                return api.sendMessage(`❌ You don't have enough money in your wallet. Your wallet balance: $${walletBalance}`, threadID, messageID);
            }
            
            // Create investment
            const investmentId = Date.now().toString().slice(-6); // Simple ID generation
            userInvestments.investments.push({
                id: investmentId,
                optionId: option.id,
                amount: amount,
                timestamp: Date.now()
            });
            
            // Deduct from wallet
            await Currencies.decreaseMoney(senderID, amount);
            
            // Add to history
            addInvestmentHistory(senderID, investData, "invest", amount, 0, `Invested in ${option.name}`);
            
            // Save data
            saveInvestData(investData);
            
            return api.sendMessage(
                `✅ Investment successful!\n\n` +
                `💹 Investment: ${option.name}\n` +
                `💵 Amount: $${amount}\n` +
                `🔄 ID: ${investmentId}\n` +
                `⏰ Maturity: ${moment(Date.now() + option.duration).tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A")}\n` +
                `📊 Potential Return: ${Math.round(option.minReturn * 100)}% to ${Math.round(option.maxReturn * 100)}%\n\n` +
                `💡 Use !invest withdraw ${investmentId} to withdraw after maturity.`,
                threadID, messageID
            );
            
        case "withdraw":
            // Withdraw mature investment
            if (!param) {
                return api.sendMessage("❌ Please specify an investment ID to withdraw.", threadID, messageID);
            }
            
            const investmentIndex = userInvestments.investments.findIndex(inv => inv.id === param);
            
            if (investmentIndex === -1) {
                return api.sendMessage("❌ Investment not found. Check your investment ID with !invest check.", threadID, messageID);
            }
            
            const investment = userInvestments.investments[investmentIndex];
            const investOption = investData.options.find(opt => opt.id === investment.optionId);
            
            // Check if investment has matured
            if (Date.now() < investment.timestamp + investOption.duration) {
                const timeLeft = investment.timestamp + investOption.duration - Date.now();
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                
                return api.sendMessage(
                    `❌ This investment hasn't matured yet.\n` +
                    `⏰ Time remaining: ${hoursLeft}h ${minutesLeft}m\n` +
                    `💡 You can withdraw early, but you might lose money due to penalties.\n` +
                    `To withdraw early anyway, use !invest withdrawearly ${param}`,
                    threadID, messageID
                );
            }
            
            // Calculate return
            const result = calculateReturn(investment, investOption);
            
            // Remove investment
            userInvestments.investments.splice(investmentIndex, 1);
            
            // Add to wallet
            await Currencies.increaseMoney(senderID, result.totalReturn);
            
            // Add to history
            const profitLoss = result.returnAmount;
            const description = profitLoss >= 0 ? 
                `${investOption.name} investment returned profit` : 
                `${investOption.name} investment resulted in loss`;
            
            addInvestmentHistory(
                senderID, 
                investData, 
                "withdraw", 
                investment.amount, 
                result.totalReturn, 
                description
            );
            
            // Save data
            saveInvestData(investData);
            
            // Format return percentage
            const returnPercentage = Math.round(result.returnRate * 100);
            const returnSymbol = returnPercentage >= 0 ? '📈' : '📉';
            
            return api.sendMessage(
                `💰 Investment Withdrawn! 💰\n\n` +
                `💹 Investment: ${investOption.name}\n` +
                `💵 Original Amount: $${result.originalAmount}\n` +
                `${returnSymbol} Return: ${returnPercentage}% ($${result.returnAmount})\n` +
                `💰 Total Received: $${result.totalReturn}\n\n` +
                `💡 Your new wallet balance: $${walletBalance + result.totalReturn}`,
                threadID, messageID
            );
            
        case "withdrawearly":
            // Early withdrawal with penalty
            if (!param) {
                return api.sendMessage("❌ Please specify an investment ID to withdraw early.", threadID, messageID);
            }
            
            const earlyIndex = userInvestments.investments.findIndex(inv => inv.id === param);
            
            if (earlyIndex === -1) {
                return api.sendMessage("❌ Investment not found. Check your investment ID with !invest check.", threadID, messageID);
            }
            
            const earlyInvestment = userInvestments.investments[earlyIndex];
            const earlyOption = investData.options.find(opt => opt.id === earlyInvestment.optionId);
            
            // Calculate early withdrawal penalty (50% of potential profit or 10% of investment, whichever is higher)
            const penalty = Math.max(
                Math.floor(earlyInvestment.amount * 0.1), // 10% of investment
                Math.floor(earlyInvestment.amount * earlyOption.maxReturn * 0.5) // 50% of max potential profit
            );
            
            const earlyAmount = earlyInvestment.amount - penalty;
            
            // Remove investment
            userInvestments.investments.splice(earlyIndex, 1);
            
            // Add to wallet
            await Currencies.increaseMoney(senderID, earlyAmount);
            
            // Add to history
            addInvestmentHistory(
                senderID, 
                investData, 
                "early_withdraw", 
                earlyInvestment.amount, 
                earlyAmount, 
                `Early withdrawal from ${earlyOption.name} with penalty`
            );
            
            // Save data
            saveInvestData(investData);
            
            return api.sendMessage(
                `⚠️ Early Investment Withdrawal ⚠️\n\n` +
                `💹 Investment: ${earlyOption.name}\n` +
                `💵 Original Amount: $${earlyInvestment.amount}\n` +
                `🔴 Penalty: $${penalty}\n` +
                `💰 Amount Received: $${earlyAmount}\n\n` +
                `💡 Your new wallet balance: $${walletBalance + earlyAmount}\n` +
                `⚠️ Next time, consider waiting until maturity to avoid penalties.`,
                threadID, messageID
            );
            
        case "help":
        default:
            // Show help
            return api.sendMessage(
                `💹 𝗜𝗡𝗩𝗘𝗦𝗧𝗠𝗘𝗡𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦\n\n` +
                `!invest check - View your investments and options\n` +
                `!invest invest [option] [amount] - Invest your money\n` +
                `!invest withdraw [id] - Withdraw a mature investment\n` +
                `!invest withdrawearly [id] - Withdraw before maturity (with penalty)\n` +
                `!invest help - Show this help message\n\n` +
                `💡 Available investment options: stocks, crypto, business, realestate\n` +
                `⚠️ Each investment has different risk levels, minimum amounts, and maturity periods.\n` +
                `📈 Returns are calculated based on risk - higher risk means potential for higher returns but also bigger losses!`,
                threadID, messageID
            );
    }
};