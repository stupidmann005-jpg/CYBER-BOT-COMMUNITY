const axios = global.nodemodule["axios"];
const fs = global.nodemodule["fs-extra"];

module.exports.config = {
 name: "info",
 version: "1.2.7",
 hasPermssion: 0,
 credits: "Shaon Ahmed",
 description: "Show user profile details with picture",
 commandCategory: "For users",
 hide:true,
 usages: "@mention",
 cooldowns: 5,
};


module.exports.run = async function ({ api, event, args, Users, permssion, getText ,Threads}) {
 const { threadID, messageID, mentions, senderID } = event;
 const { configPath } = global.client;
 const { ADMINBOT } = global.config;
 const { NDH } = global.config;
 const { userName } = global.data;
 const request = global.nodemodule["request"];
 const { writeFileSync } = global.nodemodule["fs-extra"];
 const mention = Object.keys(mentions);
 delete require.cache[require.resolve(configPath)];
 var config = require(configPath);
 const listAdmin = ADMINBOT || config.ADMINBOT || [];
 const listNDH = NDH || config.NDH || [];
 
 // Check if user mentioned someone
 if (mention.length > 0) {
  const userID = mention[0];
  return showUserInfo(api, event, Users, userID);
 }
 
 // If no mention, show bot info
 {
 const PREFIX = config.PREFIX;
 const namebot = config.BOTNAME;
 const { commands } = global.client;
 const threadSetting = (await Threads.getData(String(event.threadID))).data || 
 {};
 const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX 
 : global.config.PREFIX;
 const dateNow = Date.now();
 const time = process.uptime(),
 hours = Math.floor(time / (60 * 60)),
 minutes = Math.floor((time % (60 * 60)) / 60),
 seconds = Math.floor(time % 60);
 const data = [
 "Bạn không thể tìm được lệnh admin tại 'help' của MintBot",
 "Đừng mong chờ gì từ MintBot.",
 "Cái đoạn này á? Của SpermBot.",
 "Nếu muốn không lỗi lệnh thì hãy xài những lệnh có trong help vì những lệnh lỗi đã bị ẩn rồi.",
 "Đây là một con bot được các coder của MiraiProject nhúng tay vào.",
 "Muốn biết sinh nhật của Mint thì hãy xài 'birthday'.",
 "Cặc.",
 "Cút.",
 "Lồn.",
 "Bạn chưa biết.",
 "Bạn đã biết.",
 "Bạn sẽ biết.",
 "Không có gì là hoàn hảo, MintBot là ví dụ.",
 "Mirai dropped.",
 "MintBot là MiraiProject nhưng module là idea của SpermBot.",
 "Bạn không biết cách sử dụng MintBot? Đừng dùng nữa.",
 "Muốn chơi game? Qua bot khác mà chơi đây không rảnh",
 "MintBot có thể hiểu phụ nữ nhưng không thể có được họ.",
 "MintBot cân spam nhưng không có gì đáng để bạn spam."
 ];
 var link = [
 "https://i.postimg.cc/QdgH08j6/Messenger-creation-C2-A39-DCF-A8-E7-4-FC7-8715-2559476-FEEF4.gif",
 "https://i.imgur.com/WXQIgMz.jpeg",
 "https://i.postimg.cc/QdgH08j6/Messenger-creation-C2-A39-DCF-A8-E7-4-FC7-8715-2559476-FEEF4.gif",
 "https://i.imgur.com/WXQIgMz.jpeg",
 "https://i.imgur.com/WXQIgMz.jpeg",
 ];

 var i = 1;
 var msg = [];
 const moment = require("moment-timezone");
 const date = moment.tz("Asia/Dhaka").format("hh:mm:ss");
 for (const idAdmin of listAdmin) {
 if (parseInt(idAdmin)) {
 const name = await Users.getNameUser(idAdmin);
 msg.push(`${i++}/ ${name} - ${idAdmin}`);
 }
 }
 var msg1 = [];
 for (const idNDH of listNDH) {
 if (parseInt(idNDH)) {
 const name1 = (await Users.getData(idNDH)).name
 msg1.push(`${i++}/ ${name1} - ${idNDH}`);
 }
 }
 var callback = () => 
 api.sendMessage({ body: `====「 ${namebot} 」====\n» Prefix system: ${PREFIX}\n» Prefix box: ${prefix}\n» Modules: ${commands.size}\n» Ping: ${Date.now() - dateNow}ms\n──────────────\n======「 ADMIN 」 ======\n${msg.join("\n")}\n──────────────\nBot has been working for ${hours} hour(s) ${minutes} minute(s) ${seconds} second(s)\n\n» Total users: ${global.data.allUserID.length} \n» Total threads: ${global.data.allThreadID.length}\n──────────────\n[thanks for using bot!!]`, attachment: fs.createReadStream(__dirname + "/cache/kensu.jpg"), }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/kensu.jpg"));
 return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/kensu.jpg")).on("close", () => callback()); 
 }
}

/**
 * @author Shaon Ahmed
 * @warn Do not edit code or edit credits
 */

// Function to show user profile information
async function showUserInfo(api, event, Users, userID) {
 const { threadID, messageID } = event;
 try {
  // Get user information
  const userInfo = await api.getUserInfo(userID);
  const userData = await Users.getData(userID);
  const userName = userInfo[userID].name;
  const gender = userInfo[userID].gender === 'MALE' ? 'Male' : (userInfo[userID].gender === 'FEMALE' ? 'Female' : 'Not specified');
  const birthday = userInfo[userID].birthday || 'Not specified';
  const relationship = userInfo[userID].relationship_status || 'Not specified';
  const profileUrl = `https://www.facebook.com/profile.php?id=${userID}`;
  const createdTime = userInfo[userID].created_time || 'Not available';
  const followersCount = userInfo[userID].subscribers || 'Not available';
  const isVerified = userInfo[userID].is_verified ? 'Yes' : 'No';
  
  // Get user's profile picture
  const profilePicUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const profilePicResponse = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
  fs.writeFileSync(__dirname + "/cache/userprofile.jpg", Buffer.from(profilePicResponse.data, "utf-8"));
  
  // Format user information
  const userProfile = `┏━━━━━━━━━━━━━━━━━━━━━┓
┃      🌟 USER PROFILE 🌟      
┣━━━━━━━━━━━━━━━━━━━━━┫
┃ 👤 Name: ${userName}
┃ 🆔 ID: ${userID}
┃ 🚻 Gender: ${gender}
┃ 🎂 Birthday: ${birthday}
┃ ❤️ Relationship: ${relationship}
┃ 📱 Profile URL: ${profileUrl}
┃ ✅ Verified: ${isVerified}
┗━━━━━━━━━━━━━━━━━━━━━┛`;
  
  // Send message with profile picture
  return api.sendMessage(
   { body: userProfile, attachment: fs.createReadStream(__dirname + "/cache/userprofile.jpg") },
   threadID,
   () => fs.unlinkSync(__dirname + "/cache/userprofile.jpg"),
   messageID
  );
 } catch (error) {
  console.error(error);
  return api.sendMessage(`Error fetching user information: ${error.message}`, threadID, messageID);
 }
}
