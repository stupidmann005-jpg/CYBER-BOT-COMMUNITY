module.exports.config = {
name: "pair",
version: "1.0.0",
hasPermssion: 0,
credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️ (modified by GPT)",
description: "Pair two users with a romantic heart background",
commandCategory: "Picture",
cooldowns: 5,
dependencies: {
"axios": "",
"fs-extra": "",
"jimp": ""
}
};

module.exports.onLoad = async () => {
const { resolve } = global.nodemodule["path"];
const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
const { downloadFile } = global.utils;
const dirMaterial = __dirname + `/cache/canvas/`;
const path = resolve(__dirname, 'cache/canvas', 'pair_bg.jpg');
if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });
if (!existsSync(path)) await downloadFile("https://png.pngtree.com/thumb_back/fh260/background/20240204/pngtree-lovely-happy-valentines-day-background-with-realistic-3d-hearts-design-image_15600712.png", path);
};

async function makeImage({ one, two }) {
const fs = global.nodemodule["fs-extra"];
const path = global.nodemodule["path"];
const axios = global.nodemodule["axios"];
const jimp = global.nodemodule["jimp"];
const __root = path.resolve(__dirname, "cache", "canvas");

let pair_bg = await jimp.read(__root + "/pair_bg.jpg");

let pathImg = __root + `/pair_${one}_${two}.png`;
let avatarOne = __root + `/avt_${one}.png`;
let avatarTwo = __root + `/avt_${two}.png`;

let getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, 'utf-8'));

let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, 'utf-8'));

let circleOne = await jimp.read(await circle(avatarOne));
let circleTwo = await jimp.read(await circle(avatarTwo));

// Position the avatars on either side of the heart
pair_bg.composite(circleOne.resize(150, 150), 100, 150)
.composite(circleTwo.resize(150, 150), 550, 150);

let raw = await pair_bg.getBufferAsync("image/png");
fs.writeFileSync(pathImg, raw);

fs.unlinkSync(avatarOne);
fs.unlinkSync(avatarTwo);

return pathImg;
}

async function circle(image) {
const jimp = require("jimp");
image = await jimp.read(image);
image.circle();
return await image.getBufferAsync("image/png");
}

module.exports.run = async function ({ api, event }) {
const { threadID, messageID, senderID } = event;
const fs = global.nodemodule["fs-extra"];

// Match percentage
const percentages = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', '0%', '48%'];
const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

// Sender info
let senderInfo = await api.getUserInfo(senderID);
let senderName = senderInfo[senderID].name;

// Get participants
let threadInfo = await api.getThreadInfo(threadID);
let participants = threadInfo.participantIDs.filter(id => id !== senderID);

// Try opposite-gender pairing (fallback to random)
let partnerID;
try {
let infos = await api.getUserInfo(...participants);
let opposite = participants.filter(id => infos[id].gender && infos[id].gender !== senderInfo[senderID].gender);
if (opposite.length > 0) {
partnerID = opposite[Math.floor(Math.random() * opposite.length)];
} else {
partnerID = participants[Math.floor(Math.random() * participants.length)];
}
} catch (e) {
partnerID = participants[Math.floor(Math.random() * participants.length)];
}

let partnerInfo = await api.getUserInfo(partnerID);
let partnerName = partnerInfo[partnerID].name;

// Mentions
let mentions = [
{ id: senderID, tag: senderName },
{ id: partnerID, tag: partnerName }
];

// Generate and send image
let one = senderID, two = partnerID;
return makeImage({ one, two }).then(path => {
api.sendMessage({
body: `💖 Romantic Pairing 💖\n\n💘 ${senderName} has been paired with ${partnerName}\n💓 Love Compatibility: ${matchRate}\n✨ May your love shine as bright as the stars!`,
mentions,
attachment: fs.createReadStream(path)
}, threadID, () => fs.unlinkSync(path), messageID);
});
};
