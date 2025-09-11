const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.0.8",
  hasPermssion: 0,
  credits: "CYBER TEAM (modified by GPT)",
  description: "Pair two users with a romantic heart background (square avatars with border & shadow)",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    jimp: ""
  }
};

// Facebook app token (use your own if possible)
const FB_APP_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// ensure directory + background
async function ensureCanvasDir() {
  const dir = path.join(__dirname, "cache", "canvas");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
async function ensureBackground() {
  const dir = await ensureCanvasDir();
  const bgPath = path.join(dir, "pair_bg.jpg");
  if (!fs.existsSync(bgPath)) {
    const url =
      "https://png.pngtree.com/thumb_back/fh260/background/20240204/pngtree-lovely-happy-valentines-day-background-with-realistic-3d-hearts-design-image_15600712.png";
    const res = await axios.get(url, { responseType: "arraybuffer", maxRedirects: 5 });
    fs.writeFileSync(bgPath, Buffer.from(res.data));
  }
  return bgPath;
}

// fetch avatar with token
async function fetchAvatar(fbId, outPath) {
  const url = `https://graph.facebook.com/${fbId}/picture?width=512&height=512&access_token=${FB_APP_TOKEN}`;
  const res = await axios.get(url, { responseType: "arraybuffer", maxRedirects: 5 });
  fs.writeFileSync(outPath, Buffer.from(res.data));
  return outPath;
}

// prepare avatar with border + shadow
async function prepareAvatar(imagePath, size = 150, borderSize = 6, shadowOffset = 6) {
  const avatar = await Jimp.read(imagePath);
  avatar.resize(size, size);

  // canvas with border + shadow space
  const canvasSize = size + borderSize * 2 + shadowOffset;
  const canvas = new Jimp(canvasSize, canvasSize, 0x00000000); // transparent

  // shadow (black square, semi-transparent)
  const shadow = new Jimp(size + borderSize * 2, size + borderSize * 2, 0x000000aa);
  canvas.composite(shadow, shadowOffset, shadowOffset);

  // white border square
  const border = new Jimp(size + borderSize * 2, size + borderSize * 2, 0xffffffff);
  canvas.composite(border, 0, 0);

  // avatar on top
  canvas.composite(avatar, borderSize, borderSize);

  return canvas;
}

async function makeImage({ one, two }) {
  const dir = await ensureCanvasDir();
  const bgPath = await ensureBackground();
  const pair_bg = await Jimp.read(bgPath);

  const avatarOne = path.join(dir, `avt_${one}.png`);
  const avatarTwo = path.join(dir, `avt_${two}.png`);
  const outPath = path.join(dir, `pair_${one}_${two}.png`);

  // download avatars
  await fetchAvatar(one, avatarOne);
  await fetchAvatar(two, avatarTwo);

  // prepare with border + shadow
  const imgOne = await prepareAvatar(avatarOne);
  const imgTwo = await prepareAvatar(avatarTwo);

  // composite (adjust positions as needed)
  pair_bg
    .composite(imgOne, 100, 120)  // left avatar
    .composite(imgTwo, 410, 120); // right avatar

  await pair_bg.writeAsync(outPath);

  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return outPath;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const percentages = ["21%", "67%", "19%", "37%", "17%", "96%", "52%", "62%", "76%", "83%", "100%", "99%", "0%", "48%"];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  try {
    const senderInfo = await api.getUserInfo(senderID);
    const senderName = senderInfo && senderInfo[senderID] ? senderInfo[senderID].name : "You";

    const threadInfo = await api.getThreadInfo(threadID);
    const participants = (threadInfo && threadInfo.participantIDs) ? threadInfo.participantIDs.filter(id => id !== senderID) : [];
    const partnerID = participants.length ? participants[Math.floor(Math.random() * participants.length)] : senderID;

    const partnerInfo = await api.getUserInfo(partnerID);
    const partnerName = partnerInfo && partnerInfo[partnerID] ? partnerInfo[partnerID].name : "Partner";

    const mentions = [
      { id: senderID, tag: senderName },
      { id: partnerID, tag: partnerName }
    ];

    const pathImg = await makeImage({ one: senderID, two: partnerID });

    api.sendMessage({
      body: `🥰 Successful pairing\n• ${senderName} 🎀\n• ${partnerName} 🎀\n💌 Wishing you 200 years of happiness 💕\n\nLove percentage: ${matchRate} 💙`,
      mentions,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      try { fs.unlinkSync(pathImg); } catch (e) {}
    }, messageID);
  } catch (err) {
    api.sendMessage(`⚠️ Error generating pair image: ${err && err.message ? err.message : String(err)}`, threadID, messageID);
  }
};
