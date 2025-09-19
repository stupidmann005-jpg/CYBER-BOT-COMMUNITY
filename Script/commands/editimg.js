const axios = require('axios');

const EDIT_API_URL = "https://smfahim.xyz/gedit";

module.exports.config = {
	name: "editimg",
	version: "1.3.0",
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

function ensureStreamHasFilename(stream, fallbackName) {
	try {
		if (stream && typeof stream === 'object' && !stream.path) {
			stream.path = fallbackName || 'edited.png';
		}
	} catch (_) {}
	return stream;
}

async function sendStreamAttachment(api, event, stream, prompt) {
	const toSend = ensureStreamHasFilename(stream, 'edited.png');
	return api.sendMessage({ body: `✨ Edited: ${prompt}`, attachment: toSend }, event.threadID, event.messageID);
}

async function sendUrlAttachment(api, event, url, prompt) {
	const res = await axios.get(url, {
		responseType: 'stream',
		validateStatus: () => true,
		headers: { 'User-Agent': 'CyberBot/1.0 (+https://github.com/)' },
		timeout: 25000
	});
	const type = (res.headers['content-type'] || '').toLowerCase();
	if (!type.startsWith('image/')) {
		throw new Error(`URL did not return an image (status ${res.status})`);
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
	stream.path = mime.includes('jpeg') || mime.includes('jpg') ? 'edited.jpg' : mime.includes('webp') ? 'edited.webp' : 'edited.png';
	return sendStreamAttachment(api, event, stream, prompt);
}

function collectStringsDeep(value, bucket) {
	if (value == null) return;
	const t = typeof value;
	if (t === 'string') {
		bucket.push(value);
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) collectStringsDeep(item, bucket);
		return;
	}
	if (t === 'object') {
		for (const k in value) {
			try { collectStringsDeep(value[k], bucket); } catch (_) {}
		}
	}
}

function looksLikeBase64Image(str) {
	if (typeof str !== 'string') return false;
	if (str.startsWith('data:image')) return true;
	// Heuristic: long base64-ish strings
	return str.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(str);
}

function looksLikeUrl(str) {
	return typeof str === 'string' && /^https?:\/\//i.test(str);
}

async function handleJsonFallback(api, event, rawText, prompt) {
	let parsed = null;
	try { parsed = JSON.parse(rawText); } catch (_) {}

	const allStrings = [];
	if (parsed) collectStringsDeep(parsed, allStrings);
	// Also scan rawText for any URLs
	const urlRegex = /(https?:\/\/[^\s"'<>]+)/ig;
	let m;
	while ((m = urlRegex.exec(rawText)) !== null) {
		allStrings.push(m[1]);
	}

	// Try URLs first (fetch and check content-type)
	const seen = new Set();
	for (const s of allStrings) {
		if (seen.has(s)) continue; seen.add(s);
		if (looksLikeUrl(s)) {
			try {
				return await sendUrlAttachment(api, event, s, prompt);
			} catch (_) { /* try next */ }
		}
	}
	// Try base64 image strings
	for (const s of allStrings) {
		if (seen.has(s)) continue; seen.add(s);
		if (looksLikeBase64Image(s)) {
			try {
				return await sendBase64Attachment(api, event, s, prompt);
			} catch (_) { /* try next */ }
		}
	}

	throw new Error(`No usable image in JSON/text response. Snippet: ${rawText.slice(0, 180)}${rawText.length > 180 ? '…' : ''}`);
}

async function sendEditedImage(api, event, imageUrl, prompt) {
	const requestUrl = `${EDIT_API_URL}?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;
	const response = await axios.get(requestUrl, {
		responseType: 'stream',
		validateStatus: () => true,
		headers: { 'User-Agent': 'CyberBot/1.0 (+https://github.com/)' },
		timeout: 30000
	});

	if (response.status >= 400) {
		let errText = '';
		try { for await (const chunk of response.data) errText += chunk.toString(); } catch (_) {}
		throw new Error(`Edit API returned ${response.status}${errText ? `: ${errText.slice(0, 300)}` : ''}`);
	}

	const contentType = (response.headers['content-type'] || '').toLowerCase();
	if (contentType.startsWith('image/')) {
		return sendStreamAttachment(api, event, response.data, prompt);
	}

	let text = '';
	for await (const chunk of response.data) text += chunk.toString();
	return handleJsonFallback(api, event, text, prompt);
}

function getImageUrlFromEvent(event) {
	if (event.attachments && event.attachments.length > 0) {
		const att = event.attachments[0];
		if (att.type === 'photo' && att.url) return att.url;
	}
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
		console.error("editimg error:", err && err.stack ? err.stack : err);
		const msg = (err && err.message) ? `❌ Failed to edit image: ${err.message}` : "❌ Failed to edit image. Please try again later.";
		return api.sendMessage(msg, event.threadID, event.messageID);
	}
};
