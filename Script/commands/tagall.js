module.exports.config = {
  name: "tagall",
  version: "1.0.0",
  hasPermssion: 1,  // Only admins can use this command
  credits: "CYBER BOT TEAM",
  description: "Tag all members repeatedly until stopped",
  commandCategory: "group",
  usages: "[message]",
  cooldowns: 5
};

// Store active tagging sessions
let activeSessions = {};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  
  // Check if there's an active tagging session in this thread
  if (activeSessions[threadID]) {
    // Check if the message is 'stop' from the person who started the tagging
    if (body && body.toLowerCase() === 'stop' && senderID === activeSessions[threadID].startedBy) {
      clearInterval(activeSessions[threadID].intervalId);
      delete activeSessions[threadID];
      return api.sendMessage("✅ Tagging session stopped.", threadID, messageID);
    }
  }
};

module.exports.run = async function({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;
  
  // Check if there's already an active session in this thread
  if (activeSessions[threadID]) {
    return api.sendMessage("⚠️ There's already an active tagging session in this thread. Type 'stop' to end it first.", threadID, messageID);
  }
  
  // Get thread info to get list of members
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const memberIDs = threadInfo.participantIDs;
    
    // Custom message or default
    const message = args.join(" ") || "@everyone";
    
    // Function to tag everyone
    const tagEveryone = async () => {
      let mentions = [];
      
      // Get user info for mentions
      for (const id of memberIDs) {
        if (id !== api.getCurrentUserID()) { // Don't tag the bot
          const userInfo = await Users.getInfo(id);
          const name = userInfo.name || "Facebook User";
          mentions.push({
            tag: name,
            id: id
          });
        }
      }
      
      // Send the message with mentions
      api.sendMessage({
        body: message,
        mentions
      }, threadID);
    };
    
    // Start the interval for tagging
    const intervalId = setInterval(tagEveryone, 3000); // Tag every 3 seconds
    
    // Store the session info
    activeSessions[threadID] = {
      intervalId: intervalId,
      startedBy: senderID
    };
    
    // Initial tag
    await tagEveryone();
    
    // Inform how to stop
    return api.sendMessage("✅ Started tagging all members. Type 'stop' to end the tagging session.", threadID, messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage(`❌ An error occurred: ${error.message}`, threadID, messageID);
  }
};
