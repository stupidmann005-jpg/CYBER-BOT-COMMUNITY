module.exports.config = {
  name: "pair5",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "𝐂𝐘𝐁𝐄𝐑 ☢️ 𖣘 BOT TEAM (Improved by GPT)",
  description: "Pair two users with a romantic heart background (VIP only, square avatars + border + glow + effects)",
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
      "https://i.postimg.cc/44zpjGWD/background-for-the-festival-of-love-and-valentine-video.jpg",
      path
    );
  }
};

// helper: fetch avatar
async function fetchAvatar(uid, path) {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const img = (await axios.get(url, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(path, Buffer.from(img, "utf-8"));
  return path;
}

// helper: decorate avatar (square + border + shadow)
async function prepareAvatar(path, size = 200, border = 8, shadowOffset = 8) {
  const jimp = global.nodemodule["jimp"];
  const avatar = await jimp.read(path);
  avatar.resize(size, size);

  const canvasSize = size + border * 2 + shadowOffset;
  const canvas = new jimp(canvasSize, canvasSize, 0x00000000);

  // black shadow
  const shadow = new jimp(size + border * 2, size + border * 2, 0x000000aa);
  canvas.composite(shadow, shadowOffset, shadowOffset);

  // white border
  const borderImg = new jimp(size + border * 2, size + border * 2, 0xffffffff);
  canvas.composite(borderImg, 0, 0);

  // avatar inside
  canvas.composite(avatar, border, border);

  return canvas;
}

async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const jimp = global.nodemodule["jimp"];
  const __root = path.resolve(__dirname, "cache", "canvas");

  let pair_bg = await jimp.read(__root + "/pair5_bg.jpg");
  let pathImg = __root + `/pair5_${one}_${two}.png`;
  let avatarOne = __root + `/avt_${one}.png`;
  let avatarTwo = __root + `/avt_${two}.png`;

  // download avatars
  await fetchAvatar(one, avatarOne);
  await fetchAvatar(two, avatarTwo);

  // decorate avatars
  const imgOne = await prepareAvatar(avatarOne);
  const imgTwo = await prepareAvatar(avatarTwo);

  // Fix avatar positions (balanced center)
  pair_bg
    .composite(imgOne, 120, 280) // left
    .composite(imgTwo, 520, 280); // right

  // ❤️ Heart frame in the middle
  const fontHeart = await jimp.loadFont(jimp.FONT_SANS_128_RED);
  pair_bg.print(fontHeart, 350, 240, { text: "❤️", alignmentX: jimp.HORIZONTAL_ALIGN_CENTER });

  // ✨ Add sparkles
  const fontSparkle = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
  pair_bg.print(fontSparkle, 200, 150, "✨");
  pair_bg.print(fontSparkle, 700, 150, "✨");
  pair_bg.print(fontSparkle, 400, 500, "✨");

  // Gradient overlay (pink/purple romantic effect)
  const gradient = new jimp(pair_bg.bitmap.width, pair_bg.bitmap.height, (x, y) => {
    const ratio = y / pair_bg.bitmap.height;
    const r = 255 - Math.floor(100 * ratio);
    const g = 60 + Math.floor(40 * ratio);
    const b = 120 + Math.floor(80 * ratio);
    const a = 100;
    return (r << 24) | (g << 16) | (b << 8) | a;
  });
  pair_bg.composite(gradient, 0, 0, { mode: jimp.BLEND_OVERLAY, opacitySource: 0.3 });

  // Glow behind avatars
  const glow1 = imgOne.clone().resize(250, 250).blur(20);
  pair_bg.composite(glow1, 100, 260, { opacitySource: 0.4 });
  const glow2 = imgTwo.clone().resize(250, 250).blur(20);
  pair_bg.composite(glow2, 500, 260, { opacitySource: 0.4 });

  // Text footer
  const fontFooter = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
  pair_bg.print(fontFooter, 0, pair_bg.bitmap.height - 80, {
    text: "💞 Made with Love 💞",
    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: jimp.VERTICAL_ALIGN_BOTTOM
  }, pair_bg.bitmap.width, 80);

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
  } catch (error) {
    console.error("Error checking VIP status:", error);
    return false;
  }
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const fs = global.nodemodule["fs-extra"];

  const isUserVIP = await isVIP(api, senderID);
  if (!isUserVIP) {
    return api.sendMessage("❌ This command is only available for VIP users.", threadID, messageID);
  }

  const percentages = ["21%", "67%", "19%", "37%", "17%", "96%", "52%", "62%", "76%", "83%", "100%", "99%", "0%", "48%"];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  let senderInfo = await api.getUserInfo(senderID);
  let senderName = senderInfo[senderID].name;

  let threadInfo = await api.getThreadInfo(threadID);
  let participants = threadInfo.participantIDs.filter(id => id !== senderID);
  let partnerID = participants[Math.floor(Math.random() * participants.length)];
  let partnerInfo = await api.getUserInfo(partnerID);
  let partnerName = partnerInfo[partnerID].name;

  let mentions = [
    { id: senderID, tag: senderName },
    { id: partnerID, tag: partnerName }
  ];

  let one = senderID, two = partnerID;
  return makeImage({ one, two }).then(path => {
    api.sendMessage({
      body: `💖 VIP Romantic Pairing 💖\n\n💘 ${senderName} has been paired with ${partnerName}\n💓 Love Compatibility: ${matchRate}\n✨ May your love shine forever!`,
      mentions,
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);
  });
};
