const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.0.9",
  hasPermssion: 0,
  credits: "CYBER TEAM (modified by GPT)",
  description: "Pair two users with a romantic heart background (square avatars with border & shadow, opposite gender pairing)",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    jimp: ""
  }
};

// Facebook app token
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
      "https://i.postimg.cc/FRHgxLxh/love-heart-purple-1920x1080-11966.png";
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
async function prepareAvatar(imagePath, size = 350, borderSize = 8, shadowOffset = 8) {
  const avatar = await Jimp.read(imagePath);
  avatar.resize(size, size);

  const canvasSize = size + borderSize * 2 + shadowOffset;
  const canvas = new Jimp(canvasSize, canvasSize, 0x00000000);

  const shadow = new Jimp(size + borderSize * 2, size + borderSize * 2, 0x000000aa);
  canvas.composite(shadow, shadowOffset, shadowOffset);

  const border = new Jimp(size + borderSize * 2, size + borderSize * 2, 0xffffffff);
  canvas.composite(border, 0, 0);

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

  await fetchAvatar(one, avatarOne);
  await fetchAvatar(two, avatarTwo);

  const imgOne = await prepareAvatar(avatarOne);
  const imgTwo = await prepareAvatar(avatarTwo);

  pair_bg
    .composite(imgOne, 205, 180)  // left avatar
    .composite(imgTwo, 700, 180); // right avatar

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
    const senderName = senderInfo[senderID]?.name || "You";
    const senderGender = senderInfo[senderID]?.gender || "unknown";

    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo?.participantIDs?.filter(id => id !== senderID) || [];

    let partnerID;

    // try to find opposite gender partner
    let opposite = [];
    for (let uid of participants) {
      let info = await api.getUserInfo(uid);
      if (info[uid]?.gender && info[uid].gender !== senderGender) {
        opposite.push(uid);
      }
    }

    if (opposite.length > 0) {
      partnerID = opposite[Math.floor(Math.random() * opposite.length)];
    } else {
      // fallback to any random participant
      partnerID = participants.length ? participants[Math.floor(Math.random() * participants.length)] : senderID;
    }

    const partnerInfo = await api.getUserInfo(partnerID);
    const partnerName = partnerInfo[partnerID]?.name || "Partner";

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
    api.sendMessage(`⚠️ Error generating pair image: ${err?.message || String(err)}`, threadID, messageID);
  }
};
