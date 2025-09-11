const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "CYBER TEAM (modified by GPT)",
  description: "Pair two users with an opposite-gender partner",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "jimp": ""
  }
};

async function ensureBackground() {
  const dirMaterial = path.join(__dirname, "cache", "canvas");
  const bgPath = path.join(dirMaterial, "pair_bg.jpg");

  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });

  if (!fs.existsSync(bgPath)) {
    // romantic background
    const url = "https://www.hdwallpapers.in/thumbs/2021/purple_glittering_heart_in_black_background_hd_love-t2.jpg";
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(bgPath, Buffer.from(response.data, "binary"));
  }

  return bgPath;
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache", "canvas");

  const bgPath = await ensureBackground(); // ✅ make sure background exists

  let pair_bg = await Jimp.read(bgPath);
  let pathImg = path.join(__root, `pair_${one}_${two}.png`);
  let avatarOne = path.join(__root, `avt_${one}.png`);
  let avatarTwo = path.join(__root, `avt_${two}.png`);

  // get avatars
  let getAvatarOne = (await axios.get(
    `https://graph.facebook.com/${one}/picture?width=512&height=512`,
    { responseType: "arraybuffer" }
  )).data;
  fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, "utf-8"));

  let getAvatarTwo = (await axios.get(
    `https://graph.facebook.com/${two}/picture?width=512&height=512`,
    { responseType: "arraybuffer" }
  )).data;
  fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, "utf-8"));

  // square avatars (no circle mask)
  let squareOne = await Jimp.read(avatarOne);
  let squareTwo = await Jimp.read(avatarTwo);

  // check background size
  const { width, height } = pair_bg.bitmap;
  let x1 = Math.floor(width * 0.2);
  let x2 = Math.floor(width * 0.6);
  let y = Math.floor(height * 0.3);

  // put avatars on background
  pair_bg.composite(squareOne.resize(180, 180), x1, y)
         .composite(squareTwo.resize(180, 180), x2, y);

  let raw = await pair_bg.getBufferAsync("image/png");

  fs.writeFileSync(pathImg, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // Match percentage
  const percentages = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', '0%', '48%'];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  // Sender info
  let senderInfo = await api.getUserInfo(senderID);
  let senderName = senderInfo[senderID].name;
  let senderGender = senderInfo[senderID].gender; // "male" | "female" | "unknown"

  // Thread participants
  let threadInfo = await api.getThreadInfo(threadID);
  let participants = threadInfo.participantIDs.filter(id => id !== senderID);

  // Fetch genders for participants
  let usersInfo = await api.getUserInfo(...participants);

  // Opposite gender filter
  let oppositeGender = senderGender === "male" ? "female" : "male";
  let filtered = participants.filter(uid => usersInfo[uid].gender === oppositeGender);

  // Pick partner
  let partnerID;
  if (filtered.length > 0) {
    partnerID = filtered[Math.floor(Math.random() * filtered.length)];
  } else {
    // fallback random if no opposite gender found
    partnerID = participants[Math.floor(Math.random() * participants.length)];
  }

  let partnerName = usersInfo[partnerID].name;

  // Mentions
  let mentions = [
    { id: senderID, tag: senderName },
    { id: partnerID, tag: partnerName }
  ];

  // Generate and send image
  return makeImage({ one: senderID, two: partnerID }).then(pathImg => {
    api.sendMessage({
      body: `🥰 Successful pairing\n• ${senderName} 🎀\n• ${partnerName} 🎀\n💌 Wishing you 200 years of happiness 💕\n\nLove percentage: ${matchRate} 💙`,
      mentions,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => fs.unlinkSync(pathImg), messageID);
  }).catch(err => {
    api.sendMessage("⚠️ Error generating pair image: " + err.message, threadID, messageID);
  });
};
