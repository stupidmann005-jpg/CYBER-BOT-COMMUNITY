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
      return api.sendMessage("❌ | Please use:\n- teach [Question] - [Reply] (to add)\n- teach remove [Question] - [Reply] (admin only, both question and reply required, admins can remove any teaching, regular users can only remove their own)\n- teach list (to see total teachings stats)\n- teach mylist (to see your specific teachings)\n\n⚠️ Note: If 'list' or 'mylist' doesn't work, the API server might be down or experiencing issues.", event.threadID, event.messageID);
    }
    
    // Handle remove command (admin only)
    if (args[0].toLowerCase() === "remove") {
      // Check if user is admin (hasPermssion >= 1)
      if (permssion < 1) {
        return api.sendMessage("❌ | Only admins can remove teachings.", event.threadID, event.messageID);
      }
      
      // Check if the format is correct (question - answer)
      const removeText = args.slice(1).join(" ");
      const parts = removeText.split(" - ");
      
      if (parts.length < 2) {
        return api.sendMessage("❌ | Missing parameters! Required: ask & ans\nPlease use: teach remove [Question] - [Reply]", event.threadID, event.messageID);
      }
      
      const [ask, ans] = parts;
      
      // Call API to remove the teaching
      // Try the endpoints in order of most likely to work
      // Add isAdmin parameter to allow admins to remove any teaching
      const isAdmin = permssion >= 1 ? 1 : 0;
      
      try {
        // First try the /delete endpoint with both parameters and user identification
        const res = await axios.get(`${simsim}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}&isAdmin=${isAdmin}`);
        return api.sendMessage(`${res.data.message || "✅ Teaching removed successfully!"}`, event.threadID, event.messageID);
      } catch (deleteErr) {
        try {
          // Then try the /remove endpoint with both parameters and user identification
          const res = await axios.get(`${simsim}/remove?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}&isAdmin=${isAdmin}`);
          return api.sendMessage(`${res.data.message || "✅ Teaching removed successfully!"}`, event.threadID, event.messageID);
        } catch (removeErr) {
          try {
            // Try with just the ask parameter and user identification
            const res = await axios.get(`${simsim}/delete?ask=${encodeURIComponent(ask)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}&isAdmin=${isAdmin}`);
            return api.sendMessage(`${res.data.message || "✅ Teaching removed successfully!"}`, event.threadID, event.messageID);
          } catch (finalErr) {
            console.error("Error removing teaching:", finalErr);
            // Provide more detailed error message to help troubleshoot
            let errorMsg = "❌ | Answer not found under this question! The teaching might not exist or the API server might be down.";
            errorMsg += "\n\nMake sure:\n- You're using the exact format: teach remove [Question] - [Reply]";
            errorMsg += "\n- The question and answer match exactly what was taught";
            
            // Different message for admins vs regular users
            if (permssion >= 1) {
              errorMsg += "\n- As an admin, you can remove any teaching, but the teaching must exist";
            } else {
              errorMsg += "\n- You can only remove your own teachings";
            }
            
            // If there's a specific error message from the API, include it
            if (finalErr.response && finalErr.response.data && finalErr.response.data.message) {
              errorMsg += `\n\nAPI Error: ${finalErr.response.data.message}`;
            }
            
            return api.sendMessage(errorMsg, event.threadID, event.messageID);
          }
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
