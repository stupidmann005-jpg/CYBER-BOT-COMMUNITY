module.exports.config = {
	name: "math",
	version: "1.0.2",
	hasPermssion: 0,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
	description: "Education and formula challenge to earn money",
	commandCategory: "study",
	usages: "math [1 + 2/-p/-g/-v/formula]",
	cooldowns: 5,
	dependencies: {
		"axios": "",
		"fs-extra": ""
	},
	info: [
		{
			key: 'none',
			prompt: '',
			type: 'Phép toán',
			example: 'math x+1=2'
		},
		{
			key: '-p',
			prompt: 'Nguyên Hàm',
			type: 'Phương trình',
			example: 'math -p xdx'
		},
		{
			key: '-p',
			prompt: 'Tích Phân',
			type: 'Phương trình',
			example: 'math -p xdx from 0 to 2'
		},
		{
			key: '-g',
			prompt: 'Đồ Thị',
			type: 'Phương trình',
			example: 'math -g y = x^3 - 9'
		},
		{
			key: '-v',
			prompt: 'Vector',
			type: 'Tọa độ vector',
			example: 'math -v (1, 2, 3) - (5, 6, 7)'
		},
		{
			key: 'formula',
			prompt: 'Formula Challenge',
			type: 'Math Game',
			example: 'math formula'
		}
	],
	envConfig: {
		"WOLFRAM": "T8J8YV-H265UQ762K"
	}
};
// Store ongoing formula quizzes
const ongoingFormulaQuizzes = new Map();

// Generate a formula-based equation
function generateFormulaQuiz() {
    // Generate random values for x and y (small numbers for easier calculation)
    const x = Math.floor(Math.random() * 10) + 1;
    const y = Math.floor(Math.random() * 10) + 1;
    
    // Randomly select which formula to test
    const formulas = [
        { name: "x² + y²", calculate: () => x*x + y*y },
        { name: "(x + y)²", calculate: () => (x+y)*(x+y) },
        { name: "(x - y)²", calculate: () => (x-y)*(x-y) }
    ];
    
    const selectedFormula = formulas[Math.floor(Math.random() * formulas.length)];
    const answer = selectedFormula.calculate();
    
    return {
        question: `If x = ${x} and y = ${y}, calculate ${selectedFormula.name}`,
        answer: answer,
        x: x,
        y: y,
        formula: selectedFormula.name
    };
}

module.exports.handleEvent = async function({ api, event, Currencies }) {
    if (!event.body || event.type !== "message" || !event.messageID) return;
    
    const { threadID, messageID, senderID, body } = event;
    
    // Check if there's an ongoing formula quiz for this user
    if (ongoingFormulaQuizzes.has(senderID)) {
        const quizData = ongoingFormulaQuizzes.get(senderID);
        
        // Check if the message is a response to the quiz
        if (quizData.threadID === threadID) {
            const userAnswer = parseInt(body);
            
            // If the answer is a number, check if it's correct
            if (!isNaN(userAnswer)) {
                clearTimeout(quizData.timeout); // Clear the timeout
                
                if (userAnswer === quizData.answer) {
                    // Correct answer
                    await Currencies.increaseMoney(senderID, 3000);
                    const userData = await Currencies.getData(senderID);
                    
                    api.sendMessage(
                        `✅ Correct answer! You earned 3000$\nYour balance: ${userData.money}$`,
                        threadID,
                        messageID
                    );
                } else {
                     // Wrong answer
                     api.sendMessage(
                        `❌ Wrong answer! The correct answer is ${quizData.answer}`,
                        threadID,
                        messageID
                    );
                }
                
                ongoingFormulaQuizzes.delete(senderID); // Remove the quiz
            }
        }
    }
};

module.exports.run = async function ({ api, event, args, Currencies }) {
	var axios = global.nodemodule["axios"];
	var fs = global.nodemodule["fs-extra"];
	var { threadID, messageID, senderID } = event;
	var out = (msg) => api.sendMessage(msg, threadID, messageID);
	var text = [], key = global.configModule.math.WOLFRAM;
	var content = (event.type == 'message_reply') ? event.messageReply.body : args.join(" ");
	if (!content) return out("Please enter the calculation");
	else if (content.toLowerCase() === "formula") {
		// Start a formula-based quiz
		const quiz = generateFormulaQuiz();
		
		// Set a timeout for the quiz (60 seconds for formula quiz)
		const timeoutID = setTimeout(async () => {
			if (ongoingFormulaQuizzes.has(senderID)) {
				api.sendMessage(
					`⏰ Time's up! The correct answer was ${quiz.answer}`,
					threadID
				);
				ongoingFormulaQuizzes.delete(senderID);
			}
		}, 60000);
		
		// Store the quiz data
		ongoingFormulaQuizzes.set(senderID, {
			threadID,
			messageID,
			answer: quiz.answer,
			timeout: timeoutID
		});
		
		// Send the quiz question
		return api.sendMessage(
			`📊 FORMULA CHALLENGE 📊\n\nSolve this equation using the formulas:\nx²+y² and (x+y)², (x-y)²\n\n${quiz.question}\n\nSolve correctly to earn 3000$!`,
			threadID
		);
	}
	else if (content.indexOf("-p") == 0) {
		try {
			content = "primitive " + content.slice(3, content.length);
			var data = (await axios.get(`http://api.wolframalpha.com/v2/query?appid=${key}&input=${encodeURIComponent(content)}&output=json`)).data;
			if (content.includes("from") && content.includes("to")) {
				var value = data.queryresult.pods.find(e => e.id == "Input").subpods[0].plaintext;
				if (value.includes("≈")) {
					var a = value.split("≈"), b = a[0].split(" = ")[1], c = a[1];
					return out(`Fractional: ${b}\nDecimal: ${c}`);
				}
				else return out(value.split(" = ")[1]);
			}
			else return out((data.queryresult.pods.find(e => e.id == "IndefiniteIntegral").subpods[0].plaintext.split(" = ")[1]).replace("+ constant", ""));
		}
		catch (e) {
			out(`${e}`);
		}
	}
	else if (content.indexOf("-g") == 0) {
		try {
			content = "plot " + content.slice(3, content.length);
			var data = (await axios.get(`http://api.wolframalpha.com/v2/query?appid=${key}&input=${encodeURIComponent(content)}&output=json`)).data;
			var src = (data.queryresult.pods.some(e => e.id == "Plot")) ? data.queryresult.pods.find(e => e.id == "Plot").subpods[0].img.src : data.queryresult.pods.find(e => e.id == "ImplicitPlot").subpods[0].img.src;
			var img = (await axios.get(src, { responseType: 'stream' })).data;
			img.pipe(fs.createWriteStream("./graph.png")).on("close", () => api.sendMessage({ attachment: fs.createReadStream("./graph.png") }, threadID, () => fs.unlinkSync("./graph.png"), messageID));
		}
		catch (e) {
			out(`${e}`);
		}
	}
	else if (content.indexOf("-v") == 0) {
		try {
			content = "vector " + content.slice(3, content.length).replace(/\(/g, "<").replace(/\)/g, ">");
			var data = (await axios.get(`http://api.wolframalpha.com/v2/query?appid=${key}&input=${encodeURIComponent(content)}&output=json`)).data;
			var src = data.queryresult.pods.find(e => e.id == "VectorPlot").subpods[0].img.src;
			var vector_length = data.queryresult.pods.find(e => e.id == "VectorLength").subpods[0].plaintext, result;
			if (data.queryresult.pods.some(e => e.id == "Result")) result = data.queryresult.pods.find(e => e.id == "Result").subpods[0].plaintext;
			var img = (await axios.get(src, { responseType: 'stream' })).data;
			img.pipe(fs.createWriteStream("./graph.png")).on("close", () => api.sendMessage({ body: (!result) ? '' : result + "\nVector Length: " + vector_length, attachment: fs.createReadStream("./graph.png") }, threadID, () => fs.unlinkSync("./graph.png"), messageID));
		}
		catch (e) {
			out(`${e}`);
		}
	}
	else {
		try {
			var data = (await axios.get(`http://api.wolframalpha.com/v2/query?appid=${key}&input=${encodeURIComponent(content)}&output=json`)).data;
			if (data.queryresult.pods.some(e => e.id == "Solution")) {
				var value = data.queryresult.pods.find(e => e.id == "Solution");
				for (let e of value.subpods) text.push(e.plaintext);
				return out(text.join("\n"));
			}
			else if (data.queryresult.pods.some(e => e.id == "ComplexSolution")) {
				var value = data.queryresult.pods.find(e => e.id == "ComplexSolution");
				for (let e of value.subpods) text.push(e.plaintext);
				return out(text.join("\n"));
			}
			else if (data.queryresult.pods.some(e => e.id == "Result")) return out(data.queryresult.pods.find(e => e.id == "Result").subpods[0].plaintext);
		}
		catch (e) {
			out(`${e}`);
		}
	}
}
