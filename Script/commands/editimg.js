const axios = require('axios');

const EDIT_API_URL = "https://smfahim.xyz/gedit";

module.exports.config = {
	name: "editimg",
	version: "1.1.0",
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

async function sendStreamAttachment(api, event, stream, prompt) {
	return api.sendMessage({ body: `✨ Edited: ${prompt}`, attachment: stream }, event.threadID, event.messageID);
}

async function sendUrlAttachment(api, event, url, prompt) {
	const res = await axios.get(url, { responseType: 'stream', validateStatus: () => true });
	const type = (res.headers['content-type'] || '').toLowerCase();
	if (!type.startsWith('image/')) {
		throw new Error('URL did not return an image');
	}
	return sendStreamAttachment(api, event, res.data, prompt);
}

async function sendBase64Attachment(api, event, base64, prompt) {
	const { Readable } = require('stream');
	let data = base64;
	let mime = 'image/png';
	const dataUrlMatch = /^data:(.+?);base64,(.+)$/.exec(base64);
	if (dataUrlMatch) {
		mime = dataUrlMatch[1];
		data = dataUrlMatch[2];
	}
	const buffer = Buffer.from(data, 'base64');
	const stream = Readable.from(buffer);
	// fb-chat-api accepts streams; ensure a filename hint via body text only
	return sendStreamAttachment(api, event, stream, prompt);
}

async function handleJsonFallback(api, event, rawText, prompt) {
	let parsed = null;
	try { parsed = JSON.parse(rawText); } catch (_) {}

	// Try to extract URL candidates
	const candidates = [];
	if (parsed && typeof parsed === 'object') {
		const tryPush = (v) => { if (typeof v === 'string') candidates.push(v); };
		tryPush(parsed.url);
		tryPush(parsed.image);
		tryPush(parsed.image_url);
		tryPush(parsed.result);
		tryPush(parsed.output);
		tryPush(parsed.data && parsed.data.url);
		tryPush(parsed.data && parsed.data.image_url);
		// Arrays
		if (Array.isArray(parsed.results)) parsed.results.forEach(tryPush);
		if (Array.isArray(parsed.output)) parsed.output.forEach(tryPush);
		if (Array.isArray(parsed.images)) parsed.images.forEach(tryPush);

		// Base64 candidates
		const base64Candidates = [];
		const tryPush64 = (v) => { if (typeof v === 'string' && (v.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(v))) base64Candidates.push(v); };
		tryPush64(parsed.base64);
		tryPush64(parsed.image_base64);
		tryPush64(parsed.data && parsed.data.base64);
		if (Array.isArray(parsed.output)) parsed.output.forEach(tryPush64);
		if (Array.isArray(parsed.images)) parsed.images.forEach(tryPush64);

		if (candidates.length > 0) {
			for (const u of candidates) {
				try {
					if (/^https?:\/\//i.test(u)) {
						return await sendUrlAttachment(api, event, u, prompt);
					}
				} catch (_) { /* try next */ }
			}
		}
		if (base64Candidates.length > 0) {
			for (const b of base64Candidates) {
				try {
					return await sendBase64Attachment(api, event, b, prompt);
				} catch (_) { /* try next */ }
			}
		}
		// If API provided a textual message
		if (parsed && parsed.response && typeof parsed.response === 'string') {
			return api.sendMessage(parsed.response, event.threadID, event.messageID);
		}
	}

	// As a last resort, regex for image URLs in raw text
	const urlMatch = /(https?:\/\/[^\s]+\.(?:png|jpe?g|webp|gif))(?!\S)/i.exec(rawText);
	if (urlMatch) {
		return sendUrlAttachment(api, event, urlMatch[1], prompt);
	}

	throw new Error('No usable image in JSON/text response');
}

async function sendEditedImage(api, event, imageUrl, prompt) {
	const url = `${EDIT_API_URL}?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;
	const response = await axios.get(url, { responseType: 'stream', validateStatus: () => true });

	const contentType = (response.headers['content-type'] || '').toLowerCase();
	if (contentType.startsWith('image/')) {
		return sendStreamAttachment(api, event, response.data, prompt);
	}

	// Fallback: read stream fully and try various return shapes
	let text = '';
	for await (const chunk of response.data) text += chunk.toString();
	return handleJsonFallback(api, event, text, prompt);
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
