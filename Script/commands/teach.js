const axios = require("axios");

// Resolve MahMUD Jan base API dynamically
const getJanBase = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud + "/api/jan";
};

// Convert plain text to bold math letters/numbers
function toBold(text) {
  const mapChar = (ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + (code - 65));
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + (code - 97));
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7CE + (code - 48));
    return ch;
  };
  return String(text).split("").map(mapChar).join("");
}

// Helpers with endpoint fallbacks to avoid 404 on different deployments
async function getMsgWithFallback(base, userMessage) {
  const candidates = [
    `${base}/msg`,
    `${base}/message`,
    `${base}/get`
  ];
  let lastErr = null;
  for (const url of candidates) {
    try {
      const res = await axios.get(url, { params: { userMessage } });
      return res;
    } catch (e) {
      lastErr = e;
      if (e.response && e.response.status !== 404) break;
    }
  }
  throw lastErr || new Error("Unable to reach Jan msg endpoint");
}

async function removeWithFallback(base, trigger, index) {
  // Try DELETE with body
  try {
    return await axios.delete(`${base}/remove`, { data: { trigger, index } });
  } catch (e1) {
    // If route not found or method not allowed, try POST /remove
    if (e1.response && (e1.response.status === 404 || e1.response.status === 405)) {
      try {
        return await axios.post(`${base}/remove`, { trigger, index });
      } catch (e2) {
        // Try GET with query params as last resort
        if (e2.response && (e2.response.status === 404 || e2.response.status === 405)) {
          return await axios.get(`${base}/remove`, { params: { trigger, index } });
        }
        throw e2;
      }
    }
    throw e1;
  }
}

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
        const res = await removeWithFallback(base, trigger, index);
        return api.sendMessage(`${res.data?.message || "✅ Removed"}`, event.threadID, event.messageID);
      } catch (err) {
        const e = err.response?.data?.error || err.response?.data?.message || err.message;
        return api.sendMessage(e, event.threadID, event.messageID);
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
        const res = await getMsgWithFallback(base, searchTrigger.toLowerCase());
        if (res.data?.message || res.data?.result) {
          const text = res.data.message || res.data.result;
          return api.sendMessage(toBold(text), event.threadID, event.messageID);
        }
        return api.sendMessage("Not found.", event.threadID, event.messageID);
      } catch (err) {
        const e = err.response?.data?.error || err.response?.data?.message || err.message;
        return api.sendMessage(e, event.threadID, event.messageID);
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
      const e = err.response?.data?.error || err.response?.data?.message || err.message;
      return api.sendMessage(e, event.threadID, event.messageID);
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage(`❌ | Error: ${err.message}`, event.threadID, event.messageID);
  }
};
