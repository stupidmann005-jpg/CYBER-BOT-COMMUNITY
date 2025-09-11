const axios = global.nodemodule["axios"];
const fs = global.nodemodule["fs-extra"];

module.exports.config = {
 name: "ds",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "Trae AI",
 description: "View group dashboard with information and messages",
 commandCategory: "System",
 usages: "",
 cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText, Threads}) {
 const { threadID, messageID, senderID } = event;
 
 // Generate a unique identifier for the group
 const groupHash = Buffer.from(threadID).toString('base64');
 
 // Create dashboard URL
 const dashboardUrl = `https://dashboard.cyberbot.online/group/${groupHash}`;
 
 // Send the dashboard link to the user
 return api.sendMessage(
  `🌐 𝗚𝗥𝗢𝗨𝗣 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗 🌐\n\nView your group information, members, and messages at:\n${dashboardUrl}\n\nThis dashboard shows:\n- Group name and information\n- Member list and activity\n- Live message feed\n- Group statistics\n\nNote: This link is unique to your group. Do not share with unauthorized users.`, 
  threadID, 
  messageID
 );
}