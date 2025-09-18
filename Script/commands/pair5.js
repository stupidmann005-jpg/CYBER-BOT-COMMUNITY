module.exports.config = {
  name: "pair5",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "𝐂𝐘𝐁𝐄𝐑 ☢️ 𖣘 BOT TEAM (Modified by GPT)",
  description: "Pair two users with a romantic heart background (VIP only, square avatars + design + glow, opposite gender pairing)",
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
  const path = resolve(__dirname, "cache/canvas", "pair5_bg.jpg");

  if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });
  if (!existsSync(path)) {
    await downloadFile(
      "https://png.pngtree.com/thumb_back/fh260/background/20240204/pngtree-lovely-happy-valentines-day-background-with-realistic-3d-hearts-design-image_15600712.png",
      path
    );
  }
};

// Fetch avatar
async function fetchAvatar(uid, path) {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const img = (await axios.get(url, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(path, Buffer.from(img, "utf-8"));
  return path;
}

// Prepare avatar with border and shadow
async function prepareAvatar(path, size = 160, border = 6, shadowOffset = 6) {
  const jimp = global.nodemodule["jimp"];
  const avatar = await jimp.read(path);
  avatar.resize(size, size);

  const canvasSize = size + border * 2 + shadowOffset;
  const canvas = new jimp(canvasSize, canvasSize, 0x00000000);

  const shadow = new jimp(size + border * 2, size + border * 2, 0x000000aa);
  canvas.composite(shadow, shadowOffset, shadowOffset);

  const borderImg = new jimp(size + border * 2, size + border * 2, 0xffffffff);
  canvas.composite(borderImg, 0, 0);

  canvas.composite(avatar, border, border);

  return canvas;
}

// Make the final image
async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const jimp = global.nodemodule["jimp"];
  const __root = path.resolve(__dirname, "cache", "canvas");

  let pair_bg = await jimp.read(__root + "/pair5_bg.jpg");
  let pathImg = __root + `/pair5_${one}_${two}.png`;
  let avatarOne = __root + `/avt_${one}.png`;
  let avatarTwo = __root + `/avt_${two}.png`;

  await fetchAvatar(one, avatarOne);
  await fetchAvatar(two, avatarTwo);

  const imgOne = await prepareAvatar(avatarOne);
  const imgTwo = await prepareAvatar(avatarTwo);

  pair_bg
    .composite(imgOne, 100, 220)
    .composite(imgTwo, 550, 220);

  const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
  pair_bg.print(font, 350, 180, { text: "❤️", alignmentX: jimp.HORIZONTAL_ALIGN_CENTER });

  // Optional gradient overlay
  const gradient = new jimp(pair_bg.bitmap.width, pair_bg.bitmap.height, (x, y, idx) => {
    const ratio = y / pair_bg.bitmap.height;
    const r = 255 - Math.floor(80 * ratio);
    const g = 50 + Math.floor(30 * ratio);
    const b = 100 + Math.floor(80 * ratio);
    const a = 80;
    return (r << 24) | (g << 16) | (b << 8) | a;
  });
  pair_bg.composite(gradient, 0, 0, { mode: jimp.BLEND_OVERLAY, opacitySource: 0.3 });

  // Glow effect
  const glow = imgOne.clone().resize(200, 200).blur(15);
  pair_bg.composite(glow, 80, 200, { opacitySource: 0.4 });
  const glow2 = imgTwo.clone().resize(200, 200).blur(15);
  pair_bg.composite(glow2, 530, 200, { opacitySource: 0.4 });

  let raw = await pair_bg.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);

  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

// VIP check
async function isVIP(api, userID) {
  try {
    const botOwners = global.config.ADMINBOT || [];
    const ndh = global.config.NDH || [];
    const vipUsers = ["61553564375586", "61576520552554", "61550035211214"];
    return botOwners.includes(userID) || ndh.includes(userID) || vipUsers.includes(userID);
  } catch (err) {
    console.error("Error checking VIP status:", err);
    return false;
  }
}

// Main command
module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const fs = global.nodemodule["fs-extra"];

  const isUserVIP = await isVIP(api, senderID);
  if (!isUserVIP) {
    return api.sendMessage("❌ This command is only available for VIP users.", threadID, messageID);
  }

  const percentages = ["21%", "67%", "19%", "37%", "17%", "96%", "52%", "62%", "76%", "83%", "100%", "99%", "0%", "48%"];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  const senderInfo = await api.getUserInfo(senderID);
  const senderName = senderInfo[senderID].name;
  const senderGender = senderInfo[senderID].gender; // "male" or "female"

  const threadInfo = await api.getThreadInfo(threadID);
  const participants = threadInfo.participantIDs.filter(id => id !== senderID);

  const allInfos = await api.getUserInfo(...participants);

  // Filter opposite gender
  const oppositeGender = participants.filter(uid => {
    const gender = allInfos[uid]?.gender;
    if (!gender || !senderGender) return false;
    return (senderGender === "male" && gender === "female") ||
           (senderGender === "female" && gender === "male");
  });

  if (oppositeGender.length === 0) {
    return api.sendMessage(
      "⚠️ No opposite-gender participants found in this chat to pair with you.",
      threadID,
      messageID
    );
  }

  const partnerID = oppositeGender[Math.floor(Math.random() * oppositeGender.length)];
  const partnerInfo = await api.getUserInfo(partnerID);
  const partnerName = partnerInfo[partnerID].name;

  const mentions = [
    { id: senderID, tag: senderName },
    { id: partnerID, tag: partnerName }
  ];

  const one = senderID, two = partnerID;
  return makeImage({ one, two }).then(path => {
    api.sendMessage({
      body: `💖 VIP Romantic Pairing 💖\n\n💘 ${senderName} has been paired with ${partnerName}\n💓 Love Compatibility: ${matchRate}\n✨ May your love shine as bright as the stars!`,
      mentions,
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);
  });
};
