const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.0.3",
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

async function ensureBackground() {
  const dirMaterial = path.join(__dirname, "cache", "canvas");
  const bgPath = path.join(dirMaterial, "pair_bg.jpg");

  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });

  if (!fs.existsSync(bgPath)) {
    const url = "https://png.pngtree.com/thumb_back/fh260/background/20240204/pngtree-lovely-happy-valentines-day-background-with-realistic-3d-hearts-design-image_15600712.png";
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(bgPath, Buffer.from(response.data));
  }
  return bgPath;
}

async function downloadAvatar(id, outPath) {
  // Get direct avatar URL (avoid redirects)
  const urlData = await axios.get(
    `https://graph.facebook.com/${id}/picture?width=512&height=512&redirect=false`
  );
  const avatarURL = urlData.data.data.url;

  // Download avatar
  const imgBuffer = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(outPath, Buffer.from(imgBuffer));
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache", "canvas");
  const bgPath = await ensureBackground();
  const pair_bg = await Jimp.read(bgPath);

  const pathImg = path.join(__root, `pair_${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  await downloadAvatar(one, avatarOne);
  await downloadAvatar(two, avatarTwo);

  const circleOne = await circle(avatarOne);
  const circleTwo = await circle(avatarTwo);

  const { width, height } = pair_bg.bitmap;
  const x1 = Math.floor(width * 0.2);
  const x2 = Math.floor(width * 0.6);
  const y = Math.floor(height * 0.3);

  pair_bg
    .composite(circleOne.resize(150, 150), x1, y)
    .composite(circleTwo.resize(150, 150), x2, y);

  const raw = await pair_bg.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);

  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

async function circle(imagePath) {
  const img = await Jimp.read(imagePath);
  const mask = await new Jimp(img.bitmap.width, img.bitmap.height, 0x00000000);
  const radius = img.bitmap.width / 2;

  mask.scan(0, 0, mask.bitmap.width, mask.bitmap.height, function (x, y, idx) {
    const dx = x - radius;
    const dy = y - radius;
    if (dx * dx + dy * dy <= radius * radius) {
      this.bitmap.data[idx + 3] = 255;
    }
  });

  img.mask(mask, 0, 0);
  return img;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const percentages = ['21%', '67%', '19%', '37%', '17%', '96%', '52%', '62%', '76%', '83%', '100%', '99%', '0%', '48%'];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  const senderInfo = await api.getUserInfo(senderID);
  const senderName = senderInfo[senderID].name;

  const threadInfo = await api.getThreadInfo(threadID);
  const participants = threadInfo.participantIDs.filter(id => id !== senderID);
  const partnerID = participants[Math.floor(Math.random() * participants.length)];
  const partnerInfo = await api.getUserInfo(partnerID);
  const partnerName = partnerInfo[partnerID].name;

  const mentions = [
    { id: senderID, tag: senderName },
    { id: partnerID, tag: partnerName }
  ];

  return makeImage({ one: senderID, two: partnerID })
    .then(pathImg => {
      api.sendMessage({
        body: `🥰 Successful pairing\n• ${senderName} 🎀\n• ${partnerName} 🎀\n💌 Wishing you 200 years of happiness 💕\n\nLove percentage: ${matchRate} 💙`,
        mentions,
        attachment: fs.createReadStream(pathImg)
      }, threadID, () => fs.unlinkSync(pathImg), messageID);
    })
    .catch(err => {
      api.sendMessage("⚠️ Error generating pair image: " + err.message, threadID, messageID);
    });
};
