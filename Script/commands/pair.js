const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "CYBER TEAM (fixed by GPT)",
  description: "Pair two users with a romantic heart background",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    jimp: ""
  }
};

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

// fetch avatar buffer + content-type (defensive)
async function fetchAvatarBuffer(fbId) {
  try {
    const url = `https://graph.facebook.com/${fbId}/picture?width=512&height=512`;
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      maxRedirects: 5,
      // don't throw on redirect/304, we'll treat non-2xx as failure below
      validateStatus: () => true
    });

    const contentType = (res.headers && res.headers["content-type"]) ? res.headers["content-type"] : "";
    const buf = Buffer.from(res.data);

    return { ok: contentType.startsWith("image/"), buffer: buf, contentType, status: res.status };
  } catch (err) {
    return { ok: false, buffer: null, contentType: null, error: err.message };
  }
}

// predictable circle crop by copying pixels inside radius
async function circleCropFromJimp(imageJimp, size) {
  const src = imageJimp.clone().cover(size, size); // cover keeps aspect and fills
  const out = new Jimp(size, size, 0x00000000); // transparent
  const radius = size / 2;
  const cx = radius, cy = radius;

  // iterate pixels and copy inside circle
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      if (dx * dx + dy * dy <= radius * radius) {
        const idxSrc = src.getPixelIndex(x, y);
        const idxOut = out.getPixelIndex(x, y);
        out.bitmap.data[idxOut + 0] = src.bitmap.data[idxSrc + 0];
        out.bitmap.data[idxOut + 1] = src.bitmap.data[idxSrc + 1];
        out.bitmap.data[idxOut + 2] = src.bitmap.data[idxSrc + 2];
        out.bitmap.data[idxOut + 3] = src.bitmap.data[idxSrc + 3];
      }
    }
  }
  return out;
}

// fallback avatar (a simple colored circle)
async function makeFallbackAvatar(size, colorHex = 0xCCCCCCFF) {
  // create a solid square, then circle-crop it to have transparent outside
  const base = new Jimp(size, size, colorHex);
  // produce circular by using the same circleCropFromJimp method
  return await circleCropFromJimp(base, size);
}

async function makeImage({ one, two }) {
  const dir = await ensureCanvasDir();
  const bgPath = await ensureBackground();
  const pair_bg = await Jimp.read(bgPath);

  // pick an avatar display size relative to background
  const { width, height } = pair_bg.bitmap;
  const avatarSize = Math.max(120, Math.floor(Math.min(width, height) * 0.22)); // e.g., ~22% of smaller dimension

  // helper to get prepared circular avatar for an id (with debug files)
  async function prepareAvatar(id, debugName) {
    const fetched = await fetchAvatarBuffer(id);
    if (!fetched.ok || !fetched.buffer) {
      // save non-image content so you can inspect it
      if (fetched.buffer) {
        try {
          fs.writeFileSync(path.join(dir, `debug_nonimage_${debugName}.bin`), fetched.buffer);
        } catch (e) { /* ignore write errors */ }
      }
      // fallback
      const fallback = await makeFallbackAvatar(avatarSize);
      await fallback.writeAsync(path.join(dir, `debug_fallback_${debugName}.png`));
      return fallback;
    }

    // attempt to load with Jimp
    try {
      const jimg = await Jimp.read(fetched.buffer);
      const circ = await circleCropFromJimp(jimg, avatarSize);
      // write debug avatars so you can inspect whether download succeeded
      await circ.writeAsync(path.join(dir, `debug_avt_${debugName}.png`));
      return circ;
    } catch (err) {
      // on any read error -> fallback and save raw buffer for debugging
      try {
        fs.writeFileSync(path.join(dir, `debug_badimg_${debugName}.bin`), fetched.buffer);
      } catch (e) {}
      const fallback = await makeFallbackAvatar(avatarSize);
      await fallback.writeAsync(path.join(dir, `debug_fallback_${debugName}.png`));
      return fallback;
    }
  }

  const circleOne = await prepareAvatar(one, "one");
  const circleTwo = await prepareAvatar(two, "two");

  // compute positions (ensure they are inside canvas)
  const x1 = Math.max(0, Math.floor(width * 0.16));
  const x2 = Math.max(0, Math.floor(width * 0.62));
  const y = Math.max(0, Math.floor(height * 0.28));

  pair_bg.composite(circleOne, x1, y);
  pair_bg.composite(circleTwo, x2, y);

  // save result
  const outPath = path.join(dir, `pair_${one}_${two}.png`);
  await pair_bg.writeAsync(outPath);

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
