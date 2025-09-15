const axios = require("axios");

// Dynamically fetch MahMUD Jan API base URL
async function getJanApiBase() {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return base.data.mahmud + "/api/jan";
  } catch (e) {
    return null;
  }
}

module.exports = {
  config: {
    name: "janAuto",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Integration by Assistant",
    description: "Auto-reply using MahMUD Jan teachings DB (no prefix)",
    commandCategory: "system",
    usages: "",
    cooldowns: 0
  },
  languages: {
    en: {}
  },
  run: async function () {},
  handleEvent: async function ({ api, event }) {
    try {
      // Only react when user replies to THIS bot's message
      if (event.type !== "message_reply" || !event.messageReply) return;
      const botId = String(api.getCurrentUserID());
      if (String(event.messageReply.senderID) !== botId) return;

      const body = (event.body || "").trim();
      if (!body) return;

      const base = await getJanApiBase();
      if (!base) return;

      // Query Jan API for a reply to the user's message
      const response = await axios.get(`${base}/msg`, { params: { userMessage: body.toLowerCase() } });
      const result = response.data && (response.data.result || response.data.message);

      if (result) {
        return api.sendMessage(result, event.threadID, event.messageID);
      }
    } catch (err) {
      // Silently ignore API failures to avoid chat noise
      return;
    }
  }
};


