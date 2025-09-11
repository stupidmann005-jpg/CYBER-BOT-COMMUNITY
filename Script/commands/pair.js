// pair.js (robust + debug)
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "pair",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "CYBER TEAM (modified by GPT)",
  description: "Pair user with opposite-gender member in the same group",
  commandCategory: "Picture",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "jimp": ""
  }
};

async function downloadBackground(bgPath) {
  // list of fallback URLs (tries in order)
  const urls = [
    "https://png.pngtree.com/thumb_back/fh260/background/20240204/pngtree-lovely-happy-valentines-day-background-with-realistic-3d-hearts-design-image_15600712.png",
    "https://www.hdwallpapers.in/thumbs/2021/purple_glittering_heart_in_black_background_hd_love-t2.jpg"
  ];

  for (const url of urls) {
    try {
      console.log("[pair] trying background:", url);
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
      fs.writeFileSync(bgPath, Buffer.from(res.data, "binary"));
      console.log("[pair] background saved:", bgPath);
      return bgPath;
    } catch (err) {
      console.warn("[pair] background url failed:", url, err.message);
      // try next url
    }
  }
  throw new Error("No reachable background URLs (all failed)");
}

async function ensureBackground() {
  const dirMaterial = path.join(__dirname, "cache", "canvas");
  const bgPath = path.join(dirMaterial, "pair_bg.jpg");
  fs.ensureDirSync(dirMaterial);
  if (!fs.existsSync(bgPath)) {
    await downloadBackground(bgPath);
  } else {
    console.log("[pair] background already exists:", bgPath);
  }
  return bgPath;
}

async function fetchUserInfoFlexible(api, ids) {
  // Try different calling styles for api.getUserInfo
  // returns an object mapping id -> info
  try {
    if (!ids || ids.length === 0) return {};
    // Try passing array
    console.log("[pair] fetching user info (array) for", ids);
    let res = await api.getUserInfo(ids);
    if (res && Object.keys(res).length) return res;
  } catch (e) {
    console.warn("[pair] api.getUserInfo(ids) failed:", e.message);
  }

  try {
    // Try spreading
    console.log("[pair] fetching user info (spread) for", ids);
    let res = await api.getUserInfo(...ids);
    if (res && Object.keys(res).length) return res;
  } catch (e) {
    console.warn("[pair] api.getUserInfo(...ids) failed:", e.message);
  }

  // fallback: fetch single by single (slow)
  const map = {};
  for (const id of ids) {
    try {
      const single = await api.getUserInfo(id);
      if (single) map[id] = single[id] || single;
    } catch (e) {
      console.warn("[pair] single getUserInfo failed for", id, e.message);
    }
  }
  return map;
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache", "canvas");
  const bgPath = await ensureBackground();

  const pair_bg = await Jimp.read(bgPath);
  const pathImg = path.join(__root, `pair_${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  // download avatars
  try {
    const [av1, av2] = await Promise.all([
      axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 10000 }),
      axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 10000 })
    ]);
    fs.writeFileSync(avatarOne, Buffer.from(av1.data, "binary"));
    fs.writeFileSync(avatarTwo, Buffer.from(av2.data, "binary"));
  } catch (err) {
    // cleanup partial files
    if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne);
    if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo);
    throw new Error("Failed to download avatars: " + err.message);
  }

  // square avatars (no circle)
  const squareOne = await Jimp.read(avatarOne);
  const squareTwo = await Jimp.read(avatarTwo);

  // position avatars adaptively
  const { width, height } = pair_bg.bitmap;
  const size = Math.min(220, Math.floor(width * 0.25));
  const x1 = Math.floor(width * 0.18);
  const x2 = Math.floor(width * 0.62);
  const y = Math.floor(height * 0.25);

  pair_bg.composite(squareOne.resize(size, size), x1, y)
         .composite(squareTwo.resize(size, size), x2, y);

  const raw = await pair_bg.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);

  // cleanup avatars
  try { fs.unlinkSync(avatarOne); } catch(e) {}
  try { fs.unlinkSync(avatarTwo); } catch(e) {}

  return pathImg;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  console.log("[pair] command invoked by", senderID, "in thread", threadID);

  try {
    // Ensure group has participants and at least one other user
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo || !Array.isArray(threadInfo.participantIDs)) {
      return api.sendMessage("⚠️ Cannot read thread participants. Check bot permissions.", threadID, messageID);
    }

    const participants = threadInfo.participantIDs.filter(id => id !== senderID);
    if (participants.length === 0) {
      return api.sendMessage("⚠️ No other participants in this thread to pair with.", threadID, messageID);
    }

    // Get sender info
    const senderInfoRaw = await api.getUserInfo(senderID);
    const senderInfo = senderInfoRaw && senderInfoRaw[senderID] ? senderInfoRaw[senderID] : (senderInfoRaw || {});
    const senderName = senderInfo.name || "You";
    const senderGender = (senderInfo.gender || "unknown").toString().toLowerCase();

    console.log("[pair] sender gender:", senderGender);

    // Get participants' info
    const usersInfo = await fetchUserInfoFlexible(api, participants);
    // normalize mapping: some frameworks return nested objects, ensure usersInfo[uid].gender exists
    const participantsResolved = participants.filter(uid => usersInfo && usersInfo[uid]); // keep those found

    // choose opposite gender
    let partnerID = null;
    if (senderGender === "male" || senderGender === "female") {
      const target = senderGender === "male" ? "female" : "male";
      const candidates = participantsResolved.filter(uid => {
        const g = (usersInfo[uid].gender || "").toString().toLowerCase();
        return g === target;
      });
      if (candidates.length > 0) {
        partnerID = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    // fallback: any random participant
    if (!partnerID) partnerID = participants[Math.floor(Math.random() * participants.length)];

    // get partner name
    const partnerInfoRaw = usersInfo[partnerID] || {};
    const partnerName = partnerInfoRaw.name || "Partner";

    const mentions = [
      { id: senderID, tag: senderName },
      { id: partnerID, tag: partnerName }
    ];

    // make image and send
    console.log(`[pair] making image for ${senderID} + ${partner
