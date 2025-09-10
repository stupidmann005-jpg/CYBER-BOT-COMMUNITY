module.exports.config = {
    name: "slot",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Slot machine game with 3x multiplier",
    commandCategory: "game-sp",
    usages: "[amount]",
    cooldowns: 5,
};

module.exports.languages = {
    "vi": {
        "missingInput": "[ SLOT ] Số tiền đặt cược không được để trống hoặc là số âm",
        "moneyBetNotEnough": "[ SLOT ] Số tiền bạn đặt lớn hơn hoặc bằng số dư của bạn!",
        "limitBet": "[ SLOT ] Số coin đặt không được dưới 50$!",
        "returnWin": "🎀\n🎀\n• Baby, You win %4$\n• Game Results: [ %1 | %2 | %3 ]",
        "returnLose": "🎀\n\n• Baby, You lost %4$\n• Game Results: [ %1 | %2 | %3 ]"
    },
    "en": {
        "missingInput": "[ SLOT ] The bet money must not be blank or a negative number",
        "moneyBetNotEnough": "[ SLOT ] The money you betted is bigger than your balance!",
        "limitBet": "[ SLOT ] Your bet is too low, the minimum is 50$",
        "returnWin": "🎀\n🎀\n• Baby, You win %4$\n• Game Results: [ %1 | %2 | %3 ]",
        "returnLose": "🎀\n\n• Baby, You lost %4$\n• Game Results: [ %1 | %2 | %3 ]"
    }
}

module.exports.run = async function({ api, event, args, Currencies, getText }) {
    const { threadID, messageID, senderID } = event;
    const { getData, increaseMoney, decreaseMoney } = Currencies;
    const slotItems = ["💚", "❤", "🤍", "💙", "💜", "🧡", "💛", "🖤", "💝", "💓", "💕"];
    const moneyUser = (await getData(senderID)).money;

    var moneyBet = parseInt(args[0]);
    if (isNaN(moneyBet) || moneyBet <= 0) return api.sendMessage(getText("missingInput"), threadID, messageID);
	if (moneyBet > moneyUser) return api.sendMessage(getText("moneyBetNotEnough"), threadID, messageID);
	if (moneyBet < 50) return api.sendMessage(getText("limitBet"), threadID, messageID);
    
    var number = [], win = false;
    for (i = 0; i < 3; i++) number[i] = Math.floor(Math.random() * slotItems.length);
    
    // Check for win conditions
    if (number[0] == number[1] && number[1] == number[2]) {
        // All three match - 3x multiplier
        moneyBet *= 3;
        win = true;
    }
    else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2]) {
        // Two match - 2x multiplier
        moneyBet *= 2;
        win = true;
    }
    
    // Format the amount with $ sign
    const formattedAmount = moneyBet + "$";
    
    switch (win) {
        case true: {
            api.sendMessage(getText("returnWin", slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], formattedAmount), threadID, messageID);
            await increaseMoney(senderID, moneyBet);
            break;
        }
        case false: {
            api.sendMessage(getText("returnLose", slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], formattedAmount), threadID, messageID);
            await decreaseMoney(senderID, moneyBet);
            break;
        }
    }
}
