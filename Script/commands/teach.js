const axios = require("axios");

// Resolve MahMUD Jan base API dynamically
const getJanBase = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud + "/api/jan";
};

module.exports.config = {
  name: "teach",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "CYBER BOT Team, MahMUD Jan API",
  description: "Use MahMUD Jan teaches DB (add/remove/list)",
  commandCategory: "AI",
  usages: "teach [trigger] - [response1, response2,...] | teach remove [trigger] - [index] | teach list | teach list all | teach msg [trigger]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
  try {
    const uid = event.senderID;
    const senderName = await Users.getNameUser(uid);
    const query = args.join(" ");
    
    if (!query) {
      return api.sendMessage("❌ | Use:\n- teach [trigger] - [response1, response2,...]\n- teach remove [trigger] - [index]\n- teach list | teach list all\n- teach msg [trigger]", event.threadID, event.messageID);
    }
    const base = await getJanBase();

    // remove flow (Jan: trigger + index)
    if (args[0].toLowerCase() === "remove") {
      const removeText = args.slice(1).join(" ");
      const parts = removeText.split(" - ");
      if (parts.length < 2) {
        return api.sendMessage("❌ | Use: teach remove [trigger] - [index]", event.threadID, event.messageID);
      }
      const trigger = parts[0].trim();
      const index = parseInt(parts[1].trim(), 10);
      if (!trigger || isNaN(index)) {
        return api.sendMessage("❌ | Index must be a number. Format: teach remove [trigger] - [index]", event.threadID, event.messageID);
      }
      try {
        const res = await axios.delete(`${base}/remove`, { data: { trigger, index } });
        return api.sendMessage(`${res.data.message || "✅ Removed"}`, event.threadID, event.messageID);
      } catch (err) {
        return api.sendMessage(`${err.response?.data?.error || err.message}`, event.threadID, event.messageID);
      }
    }

    // list flow
    if (args[0].toLowerCase() === "list") {
      try {
        const endpoint = args[1] && args[1].toLowerCase() === "all" ? "/list/all" : "/list";
        const res = await axios.get(`${base}${endpoint}`);
        if (endpoint === "/list/all") {
          // Show teacher counts per user
          const data = res.data?.data || {};
          const entries = Object.entries(data);
          if (entries.length === 0) return api.sendMessage("📚 No data.", event.threadID, event.messageID);
          let msg = "👑 List of all teachers (counts):\n\n";
          for (let i = 0; i < entries.length; i++) {
            const [userID, count] = entries[i];
            msg += `${i + 1}. ${userID}: ${count}\n`;
          }
          return api.sendMessage(msg, event.threadID, event.messageID);
        }
        return api.sendMessage(res.data?.message || "📚 No data.", event.threadID, event.messageID);
      } catch (err) {
        return api.sendMessage("❌ | Failed to fetch list.", event.threadID, event.messageID);
      }
    }

    // msg lookup
    if (args[0].toLowerCase() === "msg") {
      const searchTrigger = args.slice(1).join(" ");
      if (!searchTrigger) return api.sendMessage("❌ Provide a message to search.", event.threadID, event.messageID);
      try {
        const res = await axios.get(`${base}/msg`, { params: { userMessage: `msg ${searchTrigger}` } });
        if (res.data?.message) return api.sendMessage(res.data.message, event.threadID, event.messageID);
        return api.sendMessage("Not found.", event.threadID, event.messageID);
      } catch (err) {
        return api.sendMessage(err.response?.data?.error || err.message, event.threadID, event.messageID);
      }
    }

    // add/teach
    const parts = query.split(" - ");
    if (parts.length < 2) {
      return api.sendMessage("❌ | Use: teach [trigger] - [response1, response2,...]", event.threadID, event.messageID);
    }
    const trigger = parts[0].trim();
    const responses = parts[1].trim();
    if (!trigger || !responses) {
      return api.sendMessage("❌ | Use: teach [trigger] - [response1, response2,...]", event.threadID, event.messageID);
    }
    try {
      const res = await axios.post(`${base}/teach`, { trigger, responses, userID: uid });
      return api.sendMessage(`✅ Replies added to "${trigger}"\n• Teacher: ${senderName}\n• Total: ${res.data.count || 0}`, event.threadID, event.messageID);
    } catch (err) {
      return api.sendMessage(err.response?.data || err.message, event.threadID, event.messageID);
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage(`❌ | Error: ${err.message}`, event.threadID, event.messageID);
  }
};
