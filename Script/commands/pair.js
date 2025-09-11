const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "CYBER TEAM (fixed by GPT)",
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
  const dirMaterial = path.join(__dirname, "cache", "canvas");
  const bgPath = path.join(dirMaterial, "pair_bg.jpg");

  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });

  if (!fs.existsSync(bgPath)) {
    const url = "https://miro.medium.com/v2/resize:fit:1200/1*wt0bz2sLraXwvfkkjBq7fg.jpeg"; // romantic heart background
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(bgPath, Buffer.from(response.data, "binary"));
  }
};

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache", "canvas");

  let pair_bg = await Jimp.read(path.join(__root, "pair_bg.jpg"));
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

  // circle crop avatars
  let circleOne = await circle(avatarOne);
  let circleTwo = await circle(avatarTwo);

  // check background size
  const { width, height } = pair_bg.bitmap;
  let x1 = Math.floor(width * 0.2);
  let x2 = Math.floor(width * 0.6);
  let y = Math.floor(height * 0.3);

  // put avatars on background
  pair_bg.composite(circleOne.resize(150, 150), x1, y)
         .composite(circleTwo.resize(150, 150), x2, y);

  let raw = await pair_bg.getBufferAsync("image/png");

  fs.writeFileSync(pathImg, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

async function circle(imagePath) {
  let img = await Jimp.read(imagePath);
  const mask = await new Jimp(img.bitmap.width, img.bitmap.height, 0x00000000);
  const radius = img.bitmap.width / 2;

  // draw circle mask
  mask.scan(0, 0, mask.bitmap.width, mask.bitmap.height, function (x, y, idx) {
    const dx = x - radius;
    const dy = y - radius;
    if (dx * dx + dy * dy <= radius * radius) {
      this.bitmap.data[idx + 3] = 255; // fully visible
    }
  });

  img.mask(mask, 0, 0);
  return img;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

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
