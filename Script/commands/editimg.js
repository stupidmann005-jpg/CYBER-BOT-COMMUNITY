const axios = require('axios');

const EDIT_API_URL = "https://smfahim.xyz/gedit";

module.exports.config = {
	name: "editimg",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "CyberBot Team",
	description: "Edit a replied image with a text prompt",
	commandCategory: "image",
	usages: "reply to an image with editimg <prompt>",
	cooldowns: 5,
	dependencies: {
		"axios": ""
	}
};

async function sendEditedImage(api, event, imageUrl, prompt) {
	const url = `${EDIT_API_URL}?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;
	const response = await axios.get(url, { responseType: 'stream', validateStatus: () => true });

	const contentType = (response.headers['content-type'] || '').toLowerCase();
	if (contentType.startsWith('image/')) {
		return api.sendMessage({ body: `✨ Edited: ${prompt}`, attachment: response.data }, event.threadID, event.messageID);
	}

	// Fallback: read stream to string, try parse JSON message
	let text = '';
	for await (const chunk of response.data) text += chunk.toString();
	try {
		const parsed = JSON.parse(text);
		if (parsed && parsed.response) {
			return api.sendMessage(parsed.response, event.threadID, event.messageID);
		}
	} catch (_) {}
	return api.sendMessage("❌ The edit service did not return an image.", event.threadID, event.messageID);
}

function getImageUrlFromEvent(event) {
	// Prefer direct attachments on the triggering message first
	if (event.attachments && event.attachments.length > 0) {
		const att = event.attachments[0];
		if (att.type === 'photo' && att.url) return att.url;
	}
	// Then check replied message
	if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
		const att = event.messageReply.attachments[0];
		if (att.type === 'photo' && att.url) return att.url;
	}
	return null;
}

module.exports.run = async function({ api, event, args }) {
	try {
		const prompt = args.join(" ").trim() || "enhance the image with better lighting and clarity";
		const imageUrl = getImageUrlFromEvent(event);

		if (!imageUrl) {
			return api.sendMessage("❌ Reply to a photo (or attach one) with: editimg <your prompt>", event.threadID, event.messageID);
		}

		await sendEditedImage(api, event, imageUrl, prompt);
	} catch (err) {
		console.error("editimg error:", err);
		return api.sendMessage("❌ Failed to edit image. Please try again later.", event.threadID, event.messageID);
	}
};
