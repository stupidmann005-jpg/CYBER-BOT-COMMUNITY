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
      return api.sendMessage("❌ | Please use:\n- teach [Question] - [Reply] (to add)\n- teach remove [Question] (admin only)\n- teach list (to see total teachings stats)\n- teach mylist (to see your specific teachings)\n\n⚠️ Note: If 'list' or 'mylist' doesn't work, the API server might be down or experiencing issues.", event.threadID, event.messageID);
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
      // First try the /remove endpoint
      try {
        const res = await axios.get(`${simsim}/remove?ask=${encodeURIComponent(questionToRemove)}`);
        return api.sendMessage(`${res.data.message || "✅ Teaching removed successfully!"}`, event.threadID, event.messageID);
      } catch (removeErr) {
        // If /remove fails, try the /delete endpoint which is used in baby.js
        try {
          const res = await axios.get(`${simsim}/delete?ask=${encodeURIComponent(questionToRemove)}`);
          return api.sendMessage(`${res.data.message || "✅ Teaching removed successfully!"}`, event.threadID, event.messageID);
        } catch (deleteErr) {
          console.error("Error removing teaching:", deleteErr);
          return api.sendMessage("❌ | Failed to remove teaching. The API might be down or the question doesn't exist.", event.threadID, event.messageID);
        }
      }
    }
    
    // Handle list command - shows global stats about teachings
    if (args[0].toLowerCase() === "list") {
      try {
        // Try the /list endpoint first
        const res = await axios.get(`${simsim}/list`);
        
        // Check if there's a response with different possible formats
        if (res.data) {
          // Format 1: {code: 200, totalQuestions, totalReplies, author}
          if (res.data.code === 200) {
            return api.sendMessage(
              `🤖 Total Questions Learned: ${res.data.totalQuestions}\n💬 Total Replies Stored: ${res.data.totalReplies}\n📚 Developer: ${res.data.author}`,
              event.threadID,
              event.messageID
            );
          }
          // Format 2: {status: 200, questions, replies, developer}
          else if (res.data.status === 200) {
            return api.sendMessage(
              `🤖 Total Questions Learned: ${res.data.questions}\n💬 Total Replies Stored: ${res.data.replies}\n📚 Developer: ${res.data.developer}`,
              event.threadID,
              event.messageID
            );
          }
          // Format 3: Direct data without status code
          else if (res.data.questions || res.data.totalQuestions) {
            const questions = res.data.questions || res.data.totalQuestions;
            const replies = res.data.replies || res.data.totalReplies;
            const developer = res.data.developer || res.data.author || "Unknown";
            
            return api.sendMessage(
              `🤖 Total Questions Learned: ${questions}\n💬 Total Replies Stored: ${replies}\n📚 Developer: ${developer}`,
              event.threadID,
              event.messageID
            );
          }
          else {
            return api.sendMessage(`Error: Failed to parse response format`, event.threadID, event.messageID);
          }
        } else {
          return api.sendMessage(`Error: No data returned from API`, event.threadID, event.messageID);
        }
      } catch (err) {
        console.error("Error fetching teachings with /list:", err);
        
        // Try the alternative endpoint that might show all teachings
        try {
          const altRes = await axios.get(`${simsim}/simsimi?text=show all teachings`);
          
          if (altRes.data && altRes.data.response) {
            return api.sendMessage(`📚 Teachings:\n\n${altRes.data.response}`, event.threadID, event.messageID);
          } else {
            return api.sendMessage("📚 No teachings found in the database.", event.threadID, event.messageID);
          }
        } catch (altErr) {
          console.error("Error fetching teachings with alternative method:", altErr);
          return api.sendMessage("❌ | Failed to fetch teachings. The API might be down.", event.threadID, event.messageID);
        }
      }
    }
    
    // Handle mylist command - shows user's teachings
    if (args[0].toLowerCase() === "mylist") {
      try {
        // Get user's teachings using the userTeachings endpoint
        const res = await axios.get(`${simsim}/userTeachings?senderID=${uid}`);
        
        // Check if there are teachings
        if (res.data && res.data.teachings && res.data.teachings.length > 0) {
          const teachings = res.data.teachings.map((item, index) => `${index + 1}. Q: ${item.ask}\nA: ${item.ans}`).join("\n\n");
          return api.sendMessage(`📚 Your teachings:\n\n${teachings}`, event.threadID, event.messageID);
        } else {
          // Fallback to using simsimi endpoint if userTeachings doesn't work
          const fallbackRes = await axios.get(`${simsim}/simsimi?text=show my teachings&senderName=${encodeURIComponent(senderName)}`);
          
          if (fallbackRes.data && fallbackRes.data.response) {
            return api.sendMessage(`📚 Your teachings:\n\n${fallbackRes.data.response}`, event.threadID, event.messageID);
          } else {
            return api.sendMessage("📚 You haven't taught me anything yet.", event.threadID, event.messageID);
          }
        }
      } catch (err) {
        console.error("Error fetching user teachings:", err);
        // Try fallback method
        try {
          const fallbackRes = await axios.get(`${simsim}/simsimi?text=show my teachings&senderName=${encodeURIComponent(senderName)}`);
          
          if (fallbackRes.data && fallbackRes.data.response) {
            return api.sendMessage(`📚 Your teachings:\n\n${fallbackRes.data.response}`, event.threadID, event.messageID);
          } else {
            return api.sendMessage("📚 You haven't taught me anything yet.", event.threadID, event.messageID);
          }
        } catch (fallbackErr) {
          return api.sendMessage("📚 You haven't taught me anything yet, or there was an error retrieving your teachings.", event.threadID, event.messageID);
        }
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
