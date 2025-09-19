const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp"); // ✅ Image processing library

module.exports.config = {
  name: "pair5",
  version: "1.2.4",
  hasPermssion: 0, // ✅ allow everyone, VIP/Admin checked inside run()
  credits: "CYBER TEAM (modified by GPT)",
  description: "VIP-only: Pair two users with a romantic heart background (square avatars with border & shadow, opposite gender pairing)",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    jimp: ""
  }
};

// ✅ Add VIP Facebook IDs here
const VIP_USERS = ["100012345678901", "61553564375586"]; // Replace with your VIP IDs

// Facebook app token
const FB_APP_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// ensure canvas directory + background
async function ensureCanvasDir() {
  const dir = path.join(__dirname, "cache", "canvas");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function ensureBackground() {
  const dir = await ensureCanvasDir();
  const bgPath = path.join(dir, "pair_bg.jpg");
  if (!fs.existsSync(bgPath)) {
    const url = "https://i.postimg.cc/Vv85hp8n/background-for-the-festival-of-love-and-valentine-video.png";
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

// prepare avatar with proportional size, border & shadow
async function prepareAvatar(imagePath, bgWidth = 1200) {
  const avatar = await Jimp.read(imagePath);

  const size = Math.floor(bgWidth * 0.25);
  const borderSize = Math.floor(size * 0.05);
  const shadowOffset = Math.floor(size * 0.05);

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

// create the paired image
async function makeImage({ one, two }) {
  const dir = await ensureCanvasDir();
  const bgPath = await ensureBackground();
  let pair_bg = await Jimp.read(bgPath);

  const bgWidth = 1200;
  const bgHeight = 700;

  pair_bg = pair_bg.resize(bgWidth, bgHeight);

  const avatarOne = path.join(dir, `avt_${one}.png`);
  const avatarTwo = path.join(dir, `avt_${two}.png`);
  const outPath = path.join(dir, `pair_${one}_${two}.png`);

  await fetchAvatar(one, avatarOne);
  await fetchAvatar(two, avatarTwo);

  const imgOne = await prepareAvatar(avatarOne, bgWidth);
  const imgTwo = await prepareAvatar(avatarTwo, bgWidth);

  const leftX = Math.floor(bgWidth * 0.15);
  const rightX = Math.floor(bgWidth * 0.60);
  const yPos = Math.floor(bgHeight * 0.25);

  pair_bg
    .composite(imgOne, leftX, yPos)
    .composite(imgTwo, rightX, yPos);

  await pair_bg.writeAsync(outPath);

  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return outPath;
}

// main command
module.exports.run = async function ({ api, event, permission }) {
  const { threadID, messageID, senderID } = event;

  // ✅ VIP/Admin check
  const isVIP = (typeof permission !== "undefined" && permission >= 2) || VIP_USERS.includes(senderID);

  if (!isVIP) {
    return api.sendMessage(
      "❌ You are not a VIP user.\n👉 This command is available only for VIP users or bot admins.",
      threadID,
      messageID
    );
  }

  const percentages = ["21%", "67%", "19%", "37%", "17%", "96%", "52%", "62%", "76%", "83%", "100%", "99%", "0%", "48%"];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  try {
    const senderInfo = await api.getUserInfo(senderID);
    const senderName = senderInfo[senderID]?.name || "You";

    // Get thread participants
    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo?.participantIDs?.filter(id => id !== senderID) || [];

    let partnerID;
    let oppositeGender = [];

    for (let uid of participants) {
      let info = await api.getUserInfo(uid);
      if (info[uid]?.gender && info[uid].gender !== senderInfo[senderID]?.gender) {
        oppositeGender.push(uid);
      }
    }

    if (oppositeGender.length > 0) {
      partnerID = oppositeGender[Math.floor(Math.random() * oppositeGender.length)];
    } else {
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
      body: `💖 𝗩𝗜𝗣 𝗥𝗼𝗺𝗮𝗻𝘁𝗶𝗰 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 💖\n\n💘 ${senderName} has been paired with ${partnerName}\n💓 𝗟𝗼𝘃𝗲 𝗖𝗼𝗺𝗽𝗮𝘁𝗶𝗯𝗶𝗹𝗶𝘁𝘆: ${matchRate}\n✨ 𝗠𝗮𝘆 𝘆𝗼𝘂𝗿 𝗹𝗼𝘃𝗲 𝘀𝗵𝗶𝗻𝗲 𝗮𝘀 𝗯𝗿𝗶𝗴𝗵𝘁 𝗮𝘀 𝘁𝗵𝗲 𝘀𝘁𝗮𝗿𝘀!`,
      mentions,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      try { fs.unlinkSync(pathImg); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage(`⚠️ Error generating pair image: ${err?.message || String(err)}`, threadID, messageID);
  }
};
