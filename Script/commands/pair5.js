module.exports.config = {
  name: "pair5",
  version: "5.1.0",
  hasPermssion: 0,
  credits: "𝐂𝐘𝐁𝐄𝐑 ☢️ 𖣘 BOT TEAM (Improved by GPT)",
  description: "VIP romantic pairing — square avatars, border, glow, opposite-gender pairing, random text style",
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
  const dirMaterial = resolve(__dirname, "cache", "canvas");

  if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });

  const bgPath = resolve(__dirname, "cache", "canvas", "pair5_bg.jpg");
  if (!existsSync(bgPath)) {
    await downloadFile(
      "https://i.postimg.cc/9XRszsCc/background-for-the-festival-of-love-and-valentine-video.jpg",
      bgPath
    );
  }
};

// === helpers ===

// write avatar binary safely
async function fetchAvatar(uid, outPath) {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  try {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const res = await axios.get(url, { responseType: "arraybuffer", maxRedirects: 5 });
    fs.writeFileSync(outPath, Buffer.from(res.data)); // binary write
    return outPath;
  } catch (err) {
    throw new Error(`Failed to download avatar for ${uid}: ${err.message}`);
  }
}

// make square avatar with border + shadow
async function prepareAvatar(avatarPath, opts = {}) {
  const Jimp = global.nodemodule["jimp"];
  const { size = 160, border = 8, shadowOffset = 8, borderColor = 0xffffffff, shadowColor = 0x000000aa } = opts;

  const avatar = await Jimp.read(avatarPath);
  avatar.resize(size, size);

  const canvasSize = size + border * 2 + shadowOffset;
  const canvas = new Jimp(canvasSize, canvasSize, 0x00000000); // transparent

  const shadow = new Jimp(size + border * 2, size + border * 2, shadowColor);
  canvas.composite(shadow, shadowOffset, shadowOffset);

  const borderImg = new Jimp(size + border * 2, size + border * 2, borderColor);
  canvas.composite(borderImg, 0, 0);

  canvas.composite(avatar, border, border);

  return canvas;
}

// draw a simple vertical gradient overlay (soft romantic)
async function makeGradientOverlay(width, height) {
  const Jimp = global.nodemodule["jimp"];
  const overlay = new Jimp(width, height, 0x00000000);
  for (let y = 0; y < height; y++) {
    // adjust colors to taste (pink -> purple)
    const ratio = y / height;
    const r = 255 - Math.floor(100 * ratio); // 255 -> 155
    const g = 60 + Math.floor(40 * ratio);   // 60 -> 100
    const b = 120 + Math.floor(80 * ratio);  // 120 -> 200
    const a = Math.floor(60); // constant alpha (0-255)
    // Jimp color integer: (r << 24) | (g << 16) | (b << 8) | a
    const color = (r << 24) | (g << 16) | (b << 8) | a;
    const line = new Jimp(width, 1, color);
    overlay.composite(line, 0, y);
  }
  return overlay;
}

// random styled message pool
function getStyledMessage(senderName, partnerName, matchRate) {
  const styles = [
`💖 𝗩𝗜𝗣 𝗥𝗼𝗺𝗮𝗻𝘁𝗶𝗰 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 💖

💘 ${senderName} has been paired with ${partnerName}
💓 𝗟𝗼𝘃𝗲 𝗖𝗼𝗺𝗽𝗮𝘁𝗶𝗯𝗶𝗹𝗶𝘁𝘆: ${matchRate}
✨ 𝗠𝗮𝘆 𝘆𝗼𝘂𝗿 𝗹𝗼𝘃𝗲 𝘀𝗵𝗶𝗻𝗲 𝗮𝘀 𝗯𝗿𝗶𝗴𝗵𝘁 𝗮𝘀 𝘁𝗵𝗲 𝘀𝘁𝗮𝗿𝘀!`,
`💖 ＶＩＰ Ｒｏｍａｎｔｉｃ Ｐａｉｒｉｎｇ 💖

💘 ${senderName} ❤ ${partnerName}
💓 Ｌｏｖｅ Ｃｏｍｐａｔｉｂｉｌｉｔｙ: ${matchRate}
✨ Ｗｉｓｈｉｎｇ ｙｏｕ 𝓮𝓽𝓮𝓻𝓷𝓪𝓵 𝓵𝓸𝓿𝓮!`,
`💖 𝓥𝓲𝓹 𝓡𝓸𝓶𝓪𝓷𝓽𝓲𝓬 𝓟𝓪𝓲𝓻𝓲𝓷𝓰 💖

💘 ${senderName} 💕 ${partnerName}
💓 𝓛𝓸𝓿𝓮 𝓒𝓸𝓶𝓹𝓪𝓽𝓲𝓫𝓲𝓵𝓲𝓽𝔂: ${matchRate}
✨ 𝓜𝓪𝔂 𝔂𝓸𝓾𝓻 𝓵𝓸𝓿𝓮 𝓼𝓱𝓲𝓷𝓮 𝓫𝓻𝓲𝓰𝓱𝓽!`,
`💖 ᴠɪᴘ ʀᴏᴍᴀɴᴛɪᴄ ᴘᴀɪʀɪɴɢ 💖

💘 ${senderName} 🎀 ${partnerName}
💓 Love Compatibility: ${matchRate}
✨ May your love shine as bright as the stars!`,
`💖 ✨ VＩＰ 𝗥𝗼𝗺𝗮𝗻𝘁𝗶𝗰 ✨ 💖

💘 ${senderName} 💞 ${partnerName}
💓 Love Compatibility: ${matchRate}
🌙 May your love be endless ✨`
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

// === image composer ===
async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const pathMod = global.nodemodule["path"];
  const Jimp = global.nodemodule["jimp"];

  const root = pathMod.resolve(__dirname, "cache", "canvas");
  const bgPath = pathMod.join(root, "pair5_bg.jpg");
  const outPath = pathMod.join(root, `pair5_${one}_${two}.png`);
  const avatarOnePath = pathMod.join(root, `avt_${one}.png`);
  const avatarTwoPath = pathMod.join(root, `avt_${two}.png`);

  // download (throws on failure)
  await fetchAvatar(one, avatarOnePath);
  await fetchAvatar(two, avatarTwoPath);

  // prepare
  const imgOne = await prepareAvatar(avatarOnePath, { size: 170, border: 8, shadowOffset: 8 });
  const imgTwo = await prepareAvatar(avatarTwoPath, { size: 170, border: 8, shadowOffset: 8 });

  // load background
  const bg = await Jimp.read(bgPath);

  // dynamic positions (centered)
  const bgW = bg.bitmap.width;
  const bgH = bg.bitmap.height;
  const avatarW = imgOne.bitmap.width;
  const avatarH = imgOne.bitmap.height;

  // place them at ~left/right thirds and vertically centered-ish
  const leftX = Math.floor(bgW * 0.16);
  const rightX = Math.floor(bgW * 0.66);
  const yPos = Math.floor(bgH * 0.28);

  // glow behind avatars
  const glow1 = imgOne.clone().resize(Math.floor(avatarW * 1.3), Math.floor(avatarH * 1.3)).blur(20);
  const glow2 = imgTwo.clone().resize(Math.floor(avatarW * 1.3), Math.floor(avatarH * 1.3)).blur(20);
  bg.composite(glow1, leftX - Math.floor((glow1.bitmap.width - avatarW)/2) - 4, yPos - Math.floor((glow1.bitmap.height - avatarH)/2) - 6, { opacitySource: 0.45 });
  bg.composite(glow2, rightX - Math.floor((glow2.bitmap.width - avatarW)/2) - 4, yPos - Math.floor((glow2.bitmap.height - avatarH)/2) - 6, { opacitySource: 0.45 });

  // avatars on top
  bg.composite(imgOne, leftX, yPos);
  bg.composite(imgTwo, rightX, yPos);

  // heart in middle
  const heartFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const heartX = Math.floor(bgW / 2) - 32;
  const heartY = Math.floor(yPos + avatarH/4) - 40;
  bg.print(heartFont, heartX, heartY, { text: "❤️", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER });

  // gradient overlay
  const gradient = await makeGradientOverlay(bgW, bgH);
  bg.composite(gradient, 0, 0, { mode: Jimp.BLEND_OVERLAY, opacitySource: 0.35 });

  // scattered sparkles (few)
  const sparkleFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const sparkles = 8;
  for (let i = 0; i < sparkles; i++) {
    const sx = Math.floor(Math.random() * bgW * 0.9);
    const sy = Math.floor(Math.random() * bgH * 0.9);
    bg.print(sparkleFont, sx, sy, Math.random() > 0.5 ? "✨" : "💕");
  }

  // footer quote placeholder (left blank; the run function picks message text)
  // Write final image
  await bg.writeAsync(outPath);

  // cleanup temp avatars
  try { if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath); } catch(e){}
  try { if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath); } catch(e){}

  return outPath;
}

// simple VIP checker (unchanged)
async function isVIP(api, userID) {
  try {
    const botOwners = global.config.ADMINBOT || [];
    const ndh = global.config.NDH || [];
    const vipUsers = ["61553564375586", "61576520552554", "61550035211214"];
    return botOwners.includes(userID) || ndh.includes(userID) || vipUsers.includes(userID);
  } catch (err) {
    console.error("VIP check error:", err);
    return false;
  }
}

// === main run ===
module.exports.run = async function ({ api, event }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID } = event;

  try {
    const allowed = await isVIP(api, senderID);
    if (!allowed) {
      return api.sendMessage("❌ This command is only available for VIP users.", threadID, messageID);
    }

    const percentages = ["21%", "67%", "19%", "37%", "17%", "96%", "52%", "62%", "76%", "83%", "100%", "99%", "0%", "48%"];
    const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

    // sender info + gender (may be undefined)
    const senderInfo = await api.getUserInfo(senderID);
    const senderName = senderInfo?.[senderID]?.name || "You";
    const senderGender = senderInfo?.[senderID]?.gender || "unknown";

    // thread participants (exclude sender)
    const threadInfo = await api.getThreadInfo(threadID);
    let participants = Array.isArray(threadInfo?.participantIDs) ? threadInfo.participantIDs.filter(id => id !== senderID) : [];

    if (!participants.length) {
      return api.sendMessage("⚠️ No other participants in this thread to pair with.", threadID, messageID);
    }

    // fetch each participant info (robust)
    const usersInfo = {};
    for (const uid of participants) {
      try {
        const info = await api.getUserInfo(uid);
        usersInfo[uid] = info?.[uid] || {};
      } catch (e) {
        usersInfo[uid] = {};
      }
    }

    // filter opposite gender (if sender gender available)
    let opposite = [];
    if (senderGender === "male" || senderGender === "female") {
      for (const uid of participants) {
        const g = usersInfo[uid]?.gender || "unknown";
        if ((senderGender === "male" && g === "female") || (senderGender === "female" && g === "male")) {
          opposite.push(uid);
        }
      }
    }

    // choose partner (opposite first, fallback to random)
    let partnerID;
    if (opposite.length > 0) partnerID = opposite[Math.floor(Math.random() * opposite.length)];
    else partnerID = participants[Math.floor(Math.random() * participants.length)];

    const partnerName = usersInfo[partnerID]?.name || (await (await api.getUserInfo(partnerID))[partnerID]?.name) || "Partner";

    // create image (wrapped so we can catch errors)
    let imagePath;
    try {
      imagePath = await makeImage({ one: senderID, two: partnerID });
    } catch (imgErr) {
      console.error("Image generation error:", imgErr);
      return api.sendMessage(`⚠️ Failed to generate image: ${imgErr.message || String(imgErr)}`, threadID, messageID);
    }

    const mentions = [
      { id: senderID, tag: senderName },
      { id: partnerID, tag: partnerName }
    ];

    // styled message
    const bodyText = getStyledMessage(senderName, partnerName, matchRate);

    // send (and cleanup image)
    api.sendMessage({
      body: bodyText,
      mentions,
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => {
      try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("pair5 command error:", err);
    return api.sendMessage(`⚠️ Something went wrong: ${err.message || String(err)}`, threadID, messageID);
  }
};
