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

// Prevent duplicate replies for the same incoming message
const handledMessageIds = new Set();

module.exports = {
  config: {
    name: "janAuto",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Integration by Assistant",
    description: "Auto-reply using MahMUD Jan teachings DB (reply-to-bot + call words)",
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
      // dedupe guard per incoming message id
      if (handledMessageIds.has(event.messageID)) return;

      const bodyRaw = (event.body || "").trim();
      if (!bodyRaw) return;
      const body = bodyRaw.toLowerCase();

      const isReplyToBot = event.type === "message_reply" && event.messageReply && String(event.messageReply.senderID) === String(api.getCurrentUserID());
      const isCallWord = event.type === "message" && /(^|\s)(bby|baby|jan|janu|bot)(\s|$)/i.test(bodyRaw);
      if (!isReplyToBot && !isCallWord) return;

      const base = await getJanApiBase();
      if (!base) return;

      // Query Jan API for a reply to the user's message
      const response = await axios.get(`${base}/msg`, { params: { userMessage: body } });
      const result = response.data && (response.data.result || response.data.message);

      if (result) {
        handledMessageIds.add(event.messageID);
        setTimeout(() => handledMessageIds.delete(event.messageID), 60000);
        const styled = `𝐉𝐀𝐍 • ${result}`;
        return api.sendMessage(styled, event.threadID, event.messageID);
      }
    } catch (err) {
      // Silently ignore API failures to avoid chat noise
      return;
    }
  }
};


