module.exports.config = {
 name: "pair",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
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
 if (!existsSync(dirMaterial + "canvas")) mkdirSync(dirMaterial, { recursive: true });
 if (!existsSync(path)) await downloadFile("https://miro.medium.com/v2/resize:fit:1200/1*wt0bz2sLraXwvfkkjBq7fg.jpeg", path);
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
 pair_bg.composite(circleOne.resize(150, 150), 100, 150).composite(circleTwo.resize(150, 150), 550, 150);

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

module.exports.run = async function ({ api, event, args }) {
 const { threadID, messageID, senderID } = event;
 const fs = global.nodemodule["fs-extra"];

 // Match percentage
 const percentages = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', '0%', '48%'];
 const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

 // Sender info
 let senderInfo = await api.getUserInfo(senderID);
 let senderName = senderInfo[senderID].name;

 // Random partner
 let threadInfo = await api.getThreadInfo(threadID);
 let participants = threadInfo.participantIDs.filter(id => id !== senderID);
 let partnerID = participants[Math.floor(Math.random() * participants.length)];
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
     body: `🥰𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐩𝐚𝐢𝐫𝐢𝐧𝐠\n• ${senderName}🎀\n• ${partnerName}🎀\n💌𝐖𝐢𝐬𝐡 𝐲𝐨𝐮 𝐭𝐰𝐨 𝐡𝐮𝐧𝐝𝐫𝐞𝐝 𝐲𝐞𝐚𝐫𝐬 𝐨𝐟 𝐡𝐚𝐩𝐩𝐢𝐧𝐞𝐬𝐬💕\n \n 𝐋𝐨𝐯𝐞 𝐩𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞 ${matchRate}💙`,
     mentions,
     attachment: fs.createReadStream(path)
   }, threadID, () => fs.unlinkSync(path), messageID);
 });
};
