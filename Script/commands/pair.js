const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "CYBER TEAM (improved by GPT)",
  description: "Pair two users with a romantic heart background",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: { axios: "", "fs-extra": "", jimp: "" }
};

async function ensureBackground() {
  const dirMaterial = path.join(__dirname, "cache", "canvas");
  const bgPath = path.join(dirMaterial, "pair_bg.jpg");
  if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });

  if (!fs.existsSync(bgPath)) {
    const url =
      "https://png.pngtree.com/thumb_back/fh260/background/20240204/pngtree-lovely-happy-valentines-day-background-with-realistic-3d-hearts-design-image_15600712.png";
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(bgPath, Buffer.from(response.data, "binary"));
  }
  return bgPath;
}

async function circle(imagePath) {
  const img = await Jimp.read(imagePath);
  const mask = await new Jimp(img.bitmap.width, img.bitmap.height, 0x00000000);
  const r = img.bitmap.width / 2;
  mask.scan(0, 0, mask.bitmap.width, mask.bitmap.height, function (x, y, idx) {
    const dx = x - r, dy = y - r;
    if (dx * dx + dy * dy <= r * r) this.bitmap.data[idx + 3] = 255;
  });
  img.mask(mask, 0, 0);
  return img;
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache", "canvas");
  const bgPath = await ensureBackground();
  const pair_bg = await Jimp.read(bgPath);

  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  const avOne = (
    await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer" })
  ).data;
  fs.writeFileSync(avatarOne, Buffer.from(avOne, "utf-8"));

  const avTwo = (
    await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer" })
  ).data;
  fs.writeFileSync(avatarTwo, Buffer.from(avTwo, "utf-8"));

  const circleOne = await circle(avatarOne);
  const circleTwo = await circle(avatarTwo);

  const { width, height } = pair_bg.bitmap;
  const x1 = Math.floor(width * 0.2);
  const x2 = Math.floor(width * 0.6);
  const y = Math.floor(height * 0.3);

  pair_bg.composite(circleOne.resize(180, 180), x1, y);
  pair_bg.composite(circleTwo.resize(180, 180), x2, y);

  const pathImg = path.join(__root, `pair_${one}_${two}.png`);
  const raw = await pair_bg.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);

  [avatarOne, avatarTwo].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
  return pathImg;
}

// Simple heuristic to guess gender by name (very basic!)
function guessGender(name) {
  const lower = name.trim().toLowerCase();
  const femaleHints = ["a", "e", "i"];
  return femaleHints.includes(lower[lower.length - 1]) ? "female" : "male";
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const percentages = ["21%", "67%", "19%", "37%", "17%", "96%", "52%", "62%", "76%", "83%", "100%", "99%", "0%", "48%"];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  const senderInfo = await api.getUserInfo(senderID);
  const senderName = senderInfo[senderID].name;
  const senderGender = guessGender(senderName);

  const threadInfo = await api.getThreadInfo(threadID);
  const others = threadInfo.participantIDs.filter(id => id !== senderID);

  // Fetch names for all participants
  const infos = await api.getUserInfo(...others);
  let oppositeGender = others.filter(id => guessGender(infos[id].name) !== senderGender);

  // Fallback if no opposite gender found
  if (oppositeGender.length === 0) oppositeGender = others;

  const partnerID = oppositeGender[Math.floor(Math.random() * oppositeGender.length)];
  const partnerName = infos[partnerID].name;

  const mentions = [
    { id: senderID, tag: senderName },
    { id: partnerID, tag: partnerName }
  ];

  try {
    const pathImg = await makeImage({ one: senderID, two: partnerID });
    api.sendMessage(
      {
        body: `🥰 Successful pairing!\n• ${senderName} 🎀\n• ${partnerName} 🎀\n💌 Wishing you endless happiness 💕\n\nLove percentage: ${matchRate} 💙`,
        mentions,
        attachment: fs.createReadStream(pathImg)
      },
      threadID,
      () => fs.unlinkSync(pathImg),
      messageID
    );
  } catch (err) {
    api.sendMessage(`⚠️ Error generating pair image: ${err.message}`, threadID, messageID);
  }
};
