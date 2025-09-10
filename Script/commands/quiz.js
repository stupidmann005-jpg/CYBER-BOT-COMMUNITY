module.exports.config = {
	name: "quiz",
	version: "2.0.0",
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
	hasPermssion: 0,
	description: "Answer various quiz types (Math, Bangla, Chemistry, Grammar, Physics, Football) and earn 1000$ for correct answers",
	commandCategory: "game",
	cooldowns: 5,
	dependencies: {
		"axios": ""
	}
};

module.exports.handleReply = async ({ api, event, handleReply, Currencies }) => {
	if (event.senderID != handleReply.author) return;
	const userAnswer = event.body.trim().toLowerCase();
	const correctAnswer = handleReply.answer.toLowerCase();
	
	if (userAnswer === correctAnswer) {
		// Add 1000$ to user's balance for correct answer
		await Currencies.increaseMoney(event.senderID, 1000);
		const userData = await Currencies.getData(event.senderID);
		api.sendMessage(`Congrats, you got the answer right! 🎉\nYou earned 1000$\nYour balance: ${userData.money}$`, event.threadID);
	}
	else api.sendMessage(`Oops, you got the answer wrong :'<\nThe correct answer is: ${handleReply.answer}`, event.threadID);
	
	const indexOfHandle = global.client.handleReply.findIndex(e => e.messageID == handleReply.messageID);
	global.client.handleReply.splice(indexOfHandle, 1);
	return;
}

module.exports.run = async ({ api, event, args, Currencies }) => {
	const axios = global.nodemodule["axios"];
	
	// Quiz categories
	const quizTypes = [
		"math", "bangla", "chemistry", "grammar", "physics", "football", "general"
	];
	
	// Get quiz type from args or select random
	let quizType = args[0]?.toLowerCase();
	if (!quizTypes.includes(quizType)) {
		quizType = quizTypes[Math.floor(Math.random() * quizTypes.length)];
	}
	
	// Quiz data for different categories
	const quizData = {
		math: [
			{
				question: "What is the value of π (pi) rounded to two decimal places?",
				options: ["A. 3.14", "B. 3.41", "C. 3.12", "D. 3.16"],
				answer: "A"
			},
			{
				question: "What is the square root of 144?",
				options: ["A. 12", "B. 14", "C. 10", "D. 16"],
				answer: "A"
			},
			{
				question: "If x + y = 10 and x - y = 4, what is the value of x?",
				options: ["A. 5", "B. 6", "C. 7", "D. 8"],
				answer: "C"
			},
			{
				question: "What is the result of 3² + 4²?",
				options: ["A. 25", "B. 24", "C. 49", "D. 16"],
				answer: "A"
			},
			{
				question: "What is the value of 5! (5 factorial)?",
				options: ["A. 120", "B. 60", "C. 24", "D. 720"],
				answer: "A"
			}
		],
		bangla: [
			{
				question: "'অভিধান' শব্দের অর্থ কি?",
				options: ["A. বই", "B. শব্দকোষ", "C. পত্রিকা", "D. কবিতা"],
				answer: "B"
			},
			{
				question: "বাংলা ভাষায় কয়টি স্বরবর্ণ আছে?",
				options: ["A. 7", "B. 9", "C. 11", "D. 13"],
				answer: "C"
			},
			{
				question: "'সাহিত্য' শব্দের সমার্থক শব্দ কোনটি?",
				options: ["A. লেখালেখি", "B. কবিতা", "C. সাহস", "D. বাণী"],
				answer: "A"
			},
			{
				question: "'আকাশ' শব্দের বিপরীত শব্দ কি?",
				options: ["A. পাতাল", "B. মাটি", "C. সমুদ্র", "D. পৃথিবী"],
				answer: "A"
			},
			{
				question: "রবীন্দ্রনাথ ঠাকুর কোন বছরে নোবেল পুরস্কার পান?",
				options: ["A. 1910", "B. 1911", "C. 1913", "D. 1915"],
				answer: "C"
			}
		],
		chemistry: [
			{
				question: "What is the chemical symbol for gold?",
				options: ["A. Go", "B. Gd", "C. Au", "D. Ag"],
				answer: "C"
			},
			{
				question: "What is the pH value of pure water at 25°C?",
				options: ["A. 0", "B. 7", "C. 14", "D. 10"],
				answer: "B"
			},
			{
				question: "Which element has the atomic number 6?",
				options: ["A. Oxygen", "B. Carbon", "C. Nitrogen", "D. Hydrogen"],
				answer: "B"
			},
			{
				question: "What is the chemical formula for water?",
				options: ["A. H2O", "B. CO2", "C. NaCl", "D. H2O2"],
				answer: "A"
			},
			{
				question: "Which gas makes up the majority of Earth's atmosphere?",
				options: ["A. Oxygen", "B. Carbon Dioxide", "C. Nitrogen", "D. Hydrogen"],
				answer: "C"
			}
		],
		grammar: [
			{
				question: "Which of the following is a proper noun?",
				options: ["A. City", "B. London", "C. Building", "D. River"],
				answer: "B"
			},
			{
				question: "Which sentence is grammatically correct?",
				options: ["A. She don't like apples", "B. She doesn't likes apples", "C. She doesn't like apples", "D. She not like apples"],
				answer: "C"
			},
			{
				question: "What is the past tense of 'eat'?",
				options: ["A. Eated", "B. Ate", "C. Eaten", "D. Eating"],
				answer: "B"
			},
			{
				question: "Which word is an adverb?",
				options: ["A. Happy", "B. Quickly", "C. Beautiful", "D. Table"],
				answer: "B"
			},
			{
				question: "What is the plural form of 'child'?",
				options: ["A. Childs", "B. Childes", "C. Children", "D. Childrens"],
				answer: "C"
			}
		],
		physics: [
			{
				question: "What is the SI unit of force?",
				options: ["A. Watt", "B. Joule", "C. Newton", "D. Pascal"],
				answer: "C"
			},
			{
				question: "What is the speed of light in vacuum?",
				options: ["A. 300,000 km/s", "B. 150,000 km/s", "C. 200,000 km/s", "D. 250,000 km/s"],
				answer: "A"
			},
			{
				question: "Which scientist proposed the theory of relativity?",
				options: ["A. Isaac Newton", "B. Albert Einstein", "C. Galileo Galilei", "D. Niels Bohr"],
				answer: "B"
			},
			{
				question: "What is the formula for kinetic energy?",
				options: ["A. KE = mgh", "B. KE = 1/2 mv²", "C. KE = mv", "D. KE = ma"],
				answer: "B"
			},
			{
				question: "Which particle has a positive charge?",
				options: ["A. Electron", "B. Neutron", "C. Proton", "D. Photon"],
				answer: "C"
			}
		],
		football: [
			{
				question: "Which country won the FIFA World Cup 2022?",
				options: ["A. Brazil", "B. France", "C. Argentina", "D. Germany"],
				answer: "C"
			},
			{
				question: "Who is known as 'The GOAT' in football?",
				options: ["A. Cristiano Ronaldo", "B. Lionel Messi", "C. Neymar Jr", "D. Kylian Mbappé"],
				answer: "B"
			},
			{
				question: "How many players are there in a standard football team on the field?",
				options: ["A. 9", "B. 10", "C. 11", "D. 12"],
				answer: "C"
			},
			{
				question: "Which club has won the most UEFA Champions League titles?",
				options: ["A. Barcelona", "B. Bayern Munich", "C. Liverpool", "D. Real Madrid"],
				answer: "D"
			},
			{
				question: "What is the duration of a standard football match (excluding extra time)?",
				options: ["A. 80 minutes", "B. 90 minutes", "C. 100 minutes", "D. 120 minutes"],
				answer: "B"
			}
		],
		general: [
			{
				question: "Which planet is known as the Red Planet?",
				options: ["A. Venus", "B. Mars", "C. Jupiter", "D. Saturn"],
				answer: "B"
			},
			{
				question: "Who painted the Mona Lisa?",
				options: ["A. Vincent van Gogh", "B. Pablo Picasso", "C. Leonardo da Vinci", "D. Michelangelo"],
				answer: "C"
			},
			{
				question: "What is the capital of Japan?",
				options: ["A. Beijing", "B. Seoul", "C. Tokyo", "D. Bangkok"],
				answer: "C"
			},
			{
				question: "Which animal is known as the 'King of the Jungle'?",
				options: ["A. Tiger", "B. Lion", "C. Elephant", "D. Gorilla"],
				answer: "B"
			},
			{
				question: "What is the largest ocean on Earth?",
				options: ["A. Atlantic Ocean", "B. Indian Ocean", "C. Arctic Ocean", "D. Pacific Ocean"],
				answer: "D"
			}
		]
	};
	
	// Select a random question from the chosen category
	const questions = quizData[quizType];
	const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
	
	// Format the question and options
	const formattedQuestion = `📝 ${quizType.toUpperCase()} QUIZ 📝\n\nQuestion: ${randomQuestion.question}\n\n${randomQuestion.options.join('\n')}\n\nReply with the letter of your answer (A, B, C, or D) to earn 1000$!`;
	
	// Send the question
	return api.sendMessage(formattedQuestion, event.threadID, async (err, info) => {
		// Add to handleReply
		global.client.handleReply.push({
			name: "quiz",
			messageID: info.messageID,
			author: event.senderID,
			answer: randomQuestion.answer,
			expired: false
		});
		
		// Set timeout for answer (30 seconds)
		await new Promise(resolve => setTimeout(resolve, 30 * 1000));
		
		// Check if user has answered
		const indexOfHandle = global.client.handleReply.findIndex(e => e.messageID == info.messageID);
		if (indexOfHandle !== -1) {
			const data = global.client.handleReply[indexOfHandle];
			if (!data.expired) {
				api.sendMessage(`Time out! The correct answer is: ${randomQuestion.answer}\nYou missed the chance to earn 1000$!`, event.threadID, info.messageID);
				global.client.handleReply.splice(indexOfHandle, 1);
			}
		}
		return;
	});
}
