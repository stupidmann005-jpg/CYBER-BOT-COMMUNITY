module.exports.config = {
 name: "pair5",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
 description: "Pair two users with a romantic heart background (VIP only)",
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
 const path = resolve(__dirname, 'cache/canvas', 'pair5_bg.jpg');
 if (!existsSync(dirMaterial + "canvas")) mkdirSync(dirMaterial, { recursive: true });
 if (!existsSync(path)) await downloadFile("https://i.imgur.com/dbI3Yle.jpg", path);
};

async function makeImage({ one, two }) {
 const fs = global.nodemodule["fs-extra"];
 const path = global.nodemodule["path"];
 const axios = global.nodemodule["axios"];
 const jimp = global.nodemodule["jimp"];
 const __root = path.resolve(__dirname, "cache", "canvas");

 let pair_bg = await jimp.read(__root + "/pair5_bg.jpg");
 let pathImg = __root + `/pair5_${one}_${two}.png`;
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

// Check if user is VIP
async function isVIP(api, userID) {
 try {
   // Check if user is in the ADMINBOT or NDH arrays from config
   const botOwners = global.config.ADMINBOT || [];
   const ndh = global.config.NDH || [];
   
   // You can add more VIP users here
   const vipUsers = [
     '100000478146113', // Add actual VIP user IDs here
     '61576520552554',
     '61550035211214'
   ];
   
   return botOwners.includes(userID) || ndh.includes(userID) || vipUsers.includes(userID);
 } catch (error) {
   console.error("Error checking VIP status:", error);
   return false;
 }
}

module.exports.run = async function ({ api, event, args }) {
 const { threadID, messageID, senderID } = event;

 // Check if user is VIP
 const isUserVIP = await isVIP(api, senderID);
 if (!isUserVIP) {
   return api.sendMessage("❌ This command is only available for VIP users.", threadID, messageID);
 }

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
     body: `💖 VIP Romantic Pairing 💖\n\n💘 ${senderName} has been paired with ${partnerName}\n💓 Love Compatibility: ${matchRate}\n✨ May your love shine as bright as the stars!`,
     mentions,
     attachment: fs.createReadStream(path)
   }, threadID, () => fs.unlinkSync(path), messageID);
 });
};