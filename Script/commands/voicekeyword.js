const fs = require("fs");
module.exports.config = {
	name: "voicekeyword",
    version: "1.0.0",
	hasPermssion: 0,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️", 
	description: "Responds with voice messages when specific keywords are detected",
	commandCategory: "no prefix",
	usages: "Just type the keywords in chat",
    cooldowns: 5, 
};

// Define your keywords and corresponding audio files here
// Format: { keyword: { file: "audio_file.mp3", exact: true/false, reaction: "emoji" } }
// - file: the audio file name in the noprefix folder
// - exact: if true, requires exact word match; if false, matches partial words
// - reaction: (optional) emoji reaction to add to the message
const keywordAudioMap = {
    // Examples (replace with your own keywords and audio files)
    "hello": { file: "ara.mp3", exact: false, reaction: "👋" },
    "hi": { file: "v.mp3", exact: true },
    "bye": { file: "sub.mp3", exact: true, reaction: "👋" },
    "lol": { file: "dk.mp3", exact: false, reaction: "😂" },
	"snake": { file: "snake.mp3", exact: false, reaction: "🐍" },
    // Add more keyword-audio pairs as needed
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
	const { threadID, messageID, body } = event;
    
    // Skip if message is empty
    if (!body) return;
    
    // Convert message to lowercase for case-insensitive matching
    const lowerCaseBody = body.toLowerCase();
    const words = lowerCaseBody.split(/\s+/);
    
    // Check each keyword
    for (const [keyword, config] of Object.entries(keywordAudioMap)) {
        const lowerKeyword = keyword.toLowerCase();
        let isMatch = false;
        
        if (config.exact) {
            // Exact match - check if any word matches exactly
            isMatch = words.some(word => word === lowerKeyword);
        } else {
            // Partial match - check if message contains the keyword
            isMatch = lowerCaseBody.includes(lowerKeyword);
        }
        
        if (isMatch) {
            // Check if the audio file exists
            const audioPath = __dirname + `/noprefix/${config.file}`;
            
            if (fs.existsSync(audioPath)) {
                // Add reaction if specified
                if (config.reaction) {
                    api.setMessageReaction(config.reaction, event.messageID, (err) => {}, true);
                }
                
                // Send the audio message
                var msg = {
                    body: "", // You can add a text message here if desired
                    attachment: fs.createReadStream(audioPath)
                }
                
                return api.sendMessage(msg, threadID, messageID);
            } else {
                console.error(`Audio file not found: ${audioPath}`);
            }
            
            // Break after the first match to avoid multiple responses
            break;
        }
    }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
    // This function is required but not used for no-prefix commands
};
