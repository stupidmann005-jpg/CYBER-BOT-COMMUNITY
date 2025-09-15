const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "aiimageedit",
  version: "1.0.0",
  credits: "Ullash ッ",
  hasPermssion: 0,
  commandCategory: "AI",
  description: "Add or remove objects from an image using AI",
  guide: {
    en: "Reply to an image: {pn} add a red hat | remove the background"
  },
  cooldowns: 5
};

async function editWithAPI(imageUrl, prompt) {
  // Replace with your preferred image-edit/inpaint API endpoint
  // Endpoint must accept URL and text prompt and return an image stream
  const endpoint = "https://smfahim.xyz/gedit"; // fallback generic edit like refine.js

  const res = await axios.get(
    `${endpoint}?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
    { responseType: 'stream', validateStatus: () => true }
  );
  return res;
}

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(" ").trim();

  if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Reply to an image with a short prompt. Example: aiimageedit add a red hat", event.threadID, event.messageID);
  }

  const attachment = event.messageReply.attachments[0];
  if (attachment.type !== 'photo' || !attachment.url) {
    return api.sendMessage("❌ Please reply to a photo.", event.threadID, event.messageID);
  }

  const imageUrl = attachment.url;
  const finalPrompt = prompt || "enhance and refine the image";

  try {
    const response = await editWithAPI(imageUrl, finalPrompt);

    if (response.headers['content-type'] && response.headers['content-type'].startsWith('image/')) {
      return api.sendMessage({ body: `✨ Edited: ${finalPrompt}`, attachment: response.data }, event.threadID, event.messageID);
    }

    // Fallback: read text response
    let text = '';
    for await (const chunk of response.data) {
      text += chunk.toString();
    }
    try {
      const json = JSON.parse(text);
      if (json.response) return api.sendMessage(json.response, event.threadID, event.messageID);
    } catch (_) {}
    return api.sendMessage("❌ The AI did not return an image. Try a clearer prompt.", event.threadID, event.messageID);
  } catch (err) {
    console.error('aiimageedit error:', err);
    return api.sendMessage("❌ Failed to edit the image. Please try again later.", event.threadID, event.messageID);
  }
};


