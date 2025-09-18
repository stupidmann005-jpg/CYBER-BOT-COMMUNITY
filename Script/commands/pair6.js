const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");
const gifFrames = require("gif-frames");
const ffmpeg = require("fluent-ffmpeg");

module.exports.config = {
  name: "pair6",
  version: "1.0.0",
  hasPermssion: 2, // Admin level by default
  credits: "CYBER TEAM (modified by GPT)",
  description: "VIP-only: Pair two users with a romantic heart background using a GIF.",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    jimp: "",
    "gif-frames": "",
    "fluent-ffmpeg": ""
  }
};

// ✅ Add VIP Facebook IDs here
const VIP_USERS = ["100012345678901", "100098765432112"]; // Replace with your VIP IDs

// Facebook app token
const FB_APP_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// ensure directory + background
async function ensureCanvasDir() {
  const dir = path.join(__dirname, "cache", "canvas");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Download GIF background
async function ensureGifBackground() {
  const dir = await ensureCanvasDir();
  const gifPath = path.join(dir, "pair_bg.gif");
  if (!fs.existsSync(gifPath)) {
    const url = "file:///C:/Users/ZISAN%20COMPUTARE/Documents/hearts-glitter.gif"; // Replace with actual URL of GIF
    const res = await axios.get(url, { responseType: "arraybuffer", maxRedirects: 5 });
    fs.writeFileSync(gifPath, Buffer.from(res.data));
  }
  return gifPath;
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

  const size = Math.floor(bgWidth * 0.25); // 25% of background width
  const borderSize = Math.floor(size * 0.05); // 8% border
  const shadowOffset = Math.floor(size * 0.05); // 10% shadow offset

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

// Create paired image from GIF frames
async function makeGifImage({ one, two }) {
  const dir = await ensureCanvasDir();
  const gifPath = await ensureGifBackground();
  
  // Extract frames from the GIF background
  const frames = await gifFrames({ url: gifPath, frames: 'all', outputType: 'png' });

  // Prepare the avatars
  const avatarOne = path.join(dir, `avt_${one}.png`);
  const avatarTwo = path.join(dir, `avt_${two}.png`);
  await fetchAvatar(one, avatarOne);
  await fetchAvatar(two, avatarTwo);

  const imgOne = await prepareAvatar(avatarOne);
  const imgTwo = await prepareAvatar(avatarTwo);

  const framePaths = [];

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const framePath = path.join(dir, `frame_${i}.png`);
    const bg = await Jimp.read(frame.getImage()); // Read the GIF frame

    const bgWidth = 1200;
    const bgHeight = 700;
    
    // Resize background frame
    bg.resize(bgWidth, bgHeight);

    // Center avatars horizontally & vertically
    const leftX = Math.floor(bgWidth * 0.15);
    const rightX = Math.floor(bgWidth * 0.60);
    const yPos = Math.floor(bgHeight * 0.25);

    bg.composite(imgOne, leftX, yPos);
    bg.composite(imgTwo, rightX, yPos);

    await bg.writeAsync(framePath);
    framePaths.push(framePath);
  }

  // Reassemble the frames into a new GIF
  const outputGifPath = path.join(dir, `pair_${one}_${two}_animated.gif`);
  await createGifFromFrames(framePaths, outputGifPath);

  // Clean up individual frames
  framePaths.forEach((framePath) => fs.unlinkSync(framePath));

  return outputGifPath;
}

// Create GIF from frames
function createGifFromFrames(framePaths, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('concat:' + framePaths.join('|'))
      .inputOptions('-t 10') // Specify duration
      .output(outputPath)
      .outputOptions('-f gif')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// main command
module.exports.run = async function ({ api, event, permssion }) {
  const { threadID, messageID, senderID } = event;

  // ✅ VIP/Admin check
  const isVIP = permssion >= 2 || VIP_USERS.includes(senderID);
  if (!isVIP) {
    return api.sendMessage("❌ This command is for VIP users only.", threadID, messageID);
  }

  const percentages = ["21%", "67%", "19%", "37%", "17%", "96%", "52%", "62%", "76%", "83%", "100%", "99%", "0%", "48%"];
  const matchRate = percentages[Math.floor(Math.random() * percentages.length)];

  try {
    const senderInfo = await api.getUserInfo(senderID);
    const senderName = senderInfo[senderID]?.name || "You";
    const senderGender = senderInfo[senderID]?.gender || "unknown";

    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo?.participantIDs?.filter(id => id !== senderID) || [];

    let partnerID;
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
      partnerID = participants.length ? participants[Math.floor(Math.random() * participants.length)] : senderID;
    }

    const partnerInfo = await api.getUserInfo(partnerID);
    const partnerName = partnerInfo[partnerID]?.name || "Partner";

    const mentions = [
      { id: senderID, tag: senderName },
      { id: partnerID, tag: partnerName }
    ];

    const pathImg = await makeGifImage({ one: senderID, two: partnerID });

    api.sendMessage({
      body: `🥰 VIP Pairing Successful!\n• ${senderName} 🎀\n• ${partnerName} 🎀\n💌 Wishing you 200 years of happiness 💕\n\nLove percentage: ${matchRate} 💙`,
      mentions,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      try { fs.unlinkSync(pathImg); } catch (e) {}
    }, messageID);

  } catch (err) {
    api.sendMessage(`⚠️ Error generating pair image: ${err?.message || String(err)}`, threadID, messageID);
  }
};
