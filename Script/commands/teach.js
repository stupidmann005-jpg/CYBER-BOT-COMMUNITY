const axios = require("axios");
const simsim = "https://cyber-simsimi.onrender.com";

module.exports.config = {
  name: "teach",
  version: "1.0.0",
  hasPermssion: 0, // Set to 0 so anyone can use it
  credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
  description: "Teach the bot new responses",
  commandCategory: "AI",
  usages: "[Question] - [Reply]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users, permssion }) {
  try {
    const uid = event.senderID;
    const senderName = await Users.getNameUser(uid);
    const query = args.join(" ");
    
    if (!query) {
      return api.sendMessage("❌ | Please use:\n- teach [Question] - [Reply] (to add)\n- teach remove [Question] (admin only)\n- teach list (to see your teachings)", event.threadID, event.messageID);
    }
    
    // Handle remove command (admin only)
    if (args[0].toLowerCase() === "remove") {
      // Check if user is admin (hasPermssion >= 1)
      if (permssion < 1) {
        return api.sendMessage("❌ | Only admins can remove teachings.", event.threadID, event.messageID);
      }
      
      const questionToRemove = args.slice(1).join(" ");
      if (!questionToRemove) {
        return api.sendMessage("❌ | Please specify the question to remove.", event.threadID, event.messageID);
      }
      
      // Call API to remove the teaching
      const res = await axios.get(`${simsim}/remove?ask=${encodeURIComponent(questionToRemove)}`);
      return api.sendMessage(`${res.data.message || "✅ Teaching removed successfully!"}`, event.threadID, event.messageID);
    }
    
    // Handle list command
    if (args[0].toLowerCase() === "list") {
      const res = await axios.get(`${simsim}/list?senderID=${uid}`);
      if (res.data.teachings && res.data.teachings.length > 0) {
        const teachings = res.data.teachings.map((item, index) => `${index + 1}. Q: ${item.ask}\nA: ${item.ans}`).join("\n\n");
        return api.sendMessage(`📚 Your teachings:\n\n${teachings}`, event.threadID, event.messageID);
      } else {
        return api.sendMessage("📚 You haven't taught me anything yet.", event.threadID, event.messageID);
      }
    }
    
    // Handle teaching (adding new responses)
    const parts = query.split(" - ");
    if (parts.length < 2) {
      return api.sendMessage("❌ | Please use: teach [Question] - [Reply]", event.threadID, event.messageID);
    }
    
    const [ask, ans] = parts;
    
    // Call the API to teach the bot
    const res = await axios.get(`${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}`);
    
    // Send success message
    return api.sendMessage(`✅ ${res.data.message || "I've learned that successfully! Your teaching is permanently stored."}`, event.threadID, event.messageID);
  } catch (err) {
    console.error(err);
    return api.sendMessage(`❌ | Error: ${err.message}`, event.threadID, event.messageID);
  }
};