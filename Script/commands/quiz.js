module.exports.config = {
	name: "quiz",
	version: "1.0.1",
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
	hasPermssion: 0,
	description: "Answer questions (English) and earn 1000$ for correct answers",
	commandCategory: "game",
	cooldowns: 5,
	dependencies: {
		"axios": ""
	}
};

module.exports.handleReaction = async ({ api, event, handleReaction, Currencies }) => {
	if (!event.userID == handleReaction.author) return;
	let response = "";
	if (event.reaction == "👍") response = "True"
	else response = "False";
	if (response == handleReaction.answer) {
		// Add 1000$ to user's balance for correct answer
		await Currencies.increaseMoney(event.userID, 1000);
		const userData = await Currencies.getData(event.userID);
		api.sendMessage(`Congrats, you got the answer right! 🎉\nYou earned 1000$\nYour balance: ${userData.money}$`, event.threadID);
	}
	else api.sendMessage("Oops, you got the answer wrong :'<", event.threadID);
	const indexOfHandle = client.handleReaction.findIndex(e => e.messageID == handleReaction.messageID);
	global.client.handleReaction.splice(indexOfHandle, 1);
	handleReaction.answerYet = 1;
	return global.client.handleReaction.push(handleReaction);
}

module.exports.run = async ({  api, event, args, Currencies }) => {
	const axios = global.nodemodule["axios"];
	let difficulties = ["easy", "medium", "hard"];
	let difficulty = args[0];
	(difficulties.some(item => difficulty == item)) ? "" : difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
	let fetch = await axios(`https://opentdb.com/api.php?amount=1&encode=url3986&type=boolean&difficulty=${difficulty}`);
	if (!fetch.data) return api.sendMessage("Can't find the question because the server is busy", event.threadID, event.messageID);
	return api.sendMessage(`Here is the question for you:
        ${decodeURIComponent(fetch.data.results[0].question)}

   👍: True       😢: False

Answer correctly to earn 1000$!`, event.threadID, async (err, info) => {
		global.client.handleReaction.push({
			name: "quiz",
			messageID: info.messageID,
			author: event.senderID,
			answer: fetch.data.results[0].correct_answer,
			answerYet: 0
		});
		await new Promise(resolve => setTimeout(resolve, 20 * 1000));
		const indexOfHandle = global.client.handleReaction.findIndex(e => e.messageID == info.messageID);
		let data = global.client.handleReaction[indexOfHandle];
		if (data.answerYet !== 1) {
			api.sendMessage(`Time out!! The correct answer is ${fetch.data.results[0].correct_answer}\nYou missed the chance to earn 1000$!`, event.threadID, info.messageID);
			return global.client.handleReaction.splice(indexOfHandle, 1);
		}
		else return;
	});
}
