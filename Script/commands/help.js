module.exports.config = {
        name: "help",
        version: "1.0.2",
        hasPermssion: 0,
        credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
        description: "FREE SET-UP MESSENGER",
        commandCategory: "system",
        usages: "[Name module]",
        cooldowns: 5,
        envConfig: {
                autoUnsend: true,
                delayUnsend: 20
        }
};

module.exports.languages = {
 "en": {
    "moduleInfo": "╭──────•◈•──────╮\n |        𝗜𝘀𝗹𝗮𝗺𝗶𝗰𝗸 𝗰𝗵𝗮𝘁 𝗯𝗼𝘁\n |●𝗡𝗮𝗺𝗲: •—» %1 «—•\n |●𝗨𝘀𝗮𝗴𝗲: %3\n |●𝗗𝗲𝘀𝗰𝗿𝗶p𝘁𝗶𝗼𝗻: %2\n |●𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: %4\n |●𝗪𝗮𝗶𝘁𝗶𝗻𝗴 𝘁𝗶𝗺𝗲: %5 seconds(s)\n |●𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻: %6\n |𝗠𝗼𝗱𝘂𝗹𝗲 𝗰𝗼𝗱𝗲 𝗯𝘆\n |•—» Ullash ッ «—•\n╰──────•◈•──────╯",
    "helpList": '[ There are %1 commands on this bot, Use: "%2help nameCommand" to know how to use! ]',
    "user": "User",
        "adminGroup": "Admin group",
        "adminBot": "Admin bot"
  }
};

module.exports.handleEvent = function ({ api, event, getText }) {
 const { commands } = global.client;
 const { threadID, messageID, body } = event;

 if (!body || typeof body == "undefined" || body.indexOf("help") != 0) return;
 const splitBody = body.slice(body.indexOf("help")).trim().split(/\s+/);
 if (splitBody.length == 1 || !commands.has(splitBody[1].toLowerCase())) return;
 const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
 const command = commands.get(splitBody[1].toLowerCase());
 const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
 return api.sendMessage(getText("moduleInfo", command.config.name, command.config.description, `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`, command.config.commandCategory, command.config.cooldowns, ((command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot")), command.config.credits), threadID, messageID);
}

module.exports. run = function({ api, event, args, getText }) {
  const axios = require("axios");
  const request = require('request');
  const fs = require("fs-extra");
 const { commands } = global.client;
 const { threadID, messageID } = event;
 const command = commands.get((args[0] || "").toLowerCase());
 const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
 const { autoUnsend, delayUnsend } = global.configModule[this.config.name];
 const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
if (args[0] == "all") {
    // Create categorized command list with correct spelling
    const categories = {
      "IMAGE": [],
      "AI": [],
      "GENERAL": [],
      "IMAGE GEN": [],
      "GAME": [],
      "ADMIN": [],
      "BOX CHAT": [],
      "OWNER": [],
      "FUNNY": [],
      "UTILITY": [],
      "MEDIA": [],
      "ANIME": [],
      "ECONOMY": [],
      "LOVE": [],
      "RANK": [],
      "TOOLS": [],
      "MUSIC": [],
      "SYSTEM": [],
      "STUDY": [],
      "SEARCH": [],
      "NSFW": [],
      "EDIT-IMG": [],
      "NO PREFIX": [],
      "HEALTH": [],
      "INFORMATION": [],
      "CONFIG": []
    };
    
    // Map command categories to our predefined categories with correct spelling and organization
    const categoryMapping = {
      "image": "IMAGE",
      "img": "IMAGE",
      "picture": "IMAGE",
      "png": "IMAGE",
      "random-img": "IMAGE",
      "random-image": "IMAGE",
      "ramdom-images": "IMAGE",
      "random-images": "IMAGE",
      "banner": "IMAGE",
      "cover": "IMAGE",
      "create-images": "IMAGE GEN",
      "create a photo": "IMAGE GEN",
      "𝗜𝗠𝗔𝗚𝗘 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥": "IMAGE GEN",
      "graphic": "IMAGE GEN",
      "tạo ảnh": "IMAGE GEN",
      "edit-img": "EDIT-IMG",
      "edit-image": "EDIT-IMG",
      "edit-Img": "EDIT-IMG",
      "editing": "EDIT-IMG",
      "ai": "AI",
      "ai - chatbot": "AI",
      "general": "GENERAL",
      "games": "GAME",
      "game": "GAME",
      "game-sp": "GAME",
      "admin": "ADMIN",
      "box": "BOX CHAT",
      "box chat": "BOX CHAT",
      "group": "BOX CHAT",
      "owner": "OWNER",
      "system": "SYSTEM",
      "monitor": "SYSTEM",
      "penguin": "SYSTEM",
      "funny": "FUNNY",
      "fun": "FUNNY",
      "memes": "FUNNY",
      "utility": "UTILITY",
      "utilities": "UTILITY",
      "tiện ích": "UTILITY",
      "công cụ": "UTILITY",
      "tool": "TOOLS",
      "tools": "TOOLS",
      "media": "MEDIA",
      "video": "MEDIA",
      "anime": "ANIME",
      "economy": "ECONOMY",
      "love": "LOVE",
      "tình yêu": "LOVE",
      "rank": "RANK",
      "music": "MUSIC",
      "study": "STUDY",
      "study, learn more, learn forever": "STUDY",
      "health": "HEALTH",
      "search": "SEARCH",
      "nsfw": "NSFW",
      "no prefix": "NO PREFIX",
      "noprefix": "NO PREFIX",
      "information": "INFORMATION",
      "info": "INFORMATION",
      "thông tin": "INFORMATION",
      "for users": "GENERAL",
      "user": "GENERAL",
      "config": "CONFIG",
      "filter box": "BOX CHAT",
      "bot id": "SYSTEM",
      "tag": "GENERAL",
      "tagfun": "FUNNY",
      "profile": "INFORMATION",
      "sticker": "MEDIA",
      "other": "GENERAL",
      "...": "GENERAL",
      "bday": "GENERAL",
      "doya": "GENERAL",
      "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️": "SYSTEM",
      "m h bd": "GENERAL",
      "qtv box": "BOX CHAT",
      "simsim": "AI",
      "store": "ECONOMY",
      "random-text": "GENERAL",
      "random video": "MEDIA"
    };
    
    // Categorize commands
    for (const cmd of commands.values()) {
      const category = cmd.config.commandCategory.toLowerCase();
      const mappedCategory = categoryMapping[category] || "GENERAL";
      
      if (categories[mappedCategory]) {
        categories[mappedCategory].push(cmd.config.name);
      } else {
        categories["GENERAL"].push(cmd.config.name);
      }
    }
    
    // Build the formatted message
    let msg = "";
    
    for (const [category, cmds] of Object.entries(categories)) {
      if (cmds.length > 0) {
        msg += `╭─────⭓ ${category} \n`;
        
        // Format commands in groups of 2-3 per line
        let cmdLines = [];
        let line = "";
        let count = 0;
        
        for (const cmd of cmds.sort()) {
          if (count === 0) line = "│";
          line += `✧${cmd} `;
          count++;
          
          if (count === 3 || cmds.indexOf(cmd) === cmds.length - 1) {
            cmdLines.push(line);
            count = 0;
          }
        }
        
        msg += cmdLines.join("\n") + "\n╰────────────⭓ \n\n";
      }
    }

    // Get bot owner info
    let admID = "61551846081032";
    
    api.getUserInfo(parseInt(admID), (err, data) => {
      if(err){ return console.log(err)}
      var obj = Object.keys(data);
      var firstname = data[obj].name.replace("@", "");
      
      // Add footer
      const footer = `╭─ [ YOUR SPIDER BOT] \n╰‣ Admin: ⚣︎ NOBITA 🎀 \n╰‣ Total commands: ${commands.size} \n╰‣ 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤  \n\`https://www.facebook.com/share/16yf6kDZ7o/\`  \n\n⭔Type !help <command> to learn usage.`;
      
      // Send the message
      api.sendMessage({ 
        body: msg + footer, 
        mentions: [{
          tag: firstname,
          id: admID,
          fromIndex: 0,
        }]
      }, event.threadID, event.messageID);
    });
    return;
};
 if (!command) {
  const arrayInfo = [];
  const page = parseInt(args[0]) || 1;
  const numberOfOnePage = 15;
  let i = 0;
  let msg = "";

  for (var [name, value] of (commands)) {
    name += ``;
    arrayInfo.push(name);
  }

  arrayInfo.sort((a, b) => a.data - b.data);  
  const first = numberOfOnePage * page - numberOfOnePage;
  i = first;
  const helpView = arrayInfo.slice(first, first + numberOfOnePage);

  // Format commands in groups of 3 per line with the new style
  let cmdLines = [];
  let line = "";
  let count = 0;
  
  for (const cmd of helpView) {
    if (count === 0) line = "│";
    line += `✧${cmd} `;
    count++;
    
    if (count === 3 || helpView.indexOf(cmd) === helpView.length - 1) {
      cmdLines.push(line);
      count = 0;
    }
  }
  
  msg = `╭─────⭓ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 \n${cmdLines.join("\n")}\n╰────────────⭓ \n\n`;
  
  // Add footer with pagination
  const footer = `╭─ [ YOUR SPIDER BOT] \n╰‣ Admin: ⚣︎ NOBITA 🎀 \n╰‣ Total commands: ${arrayInfo.length} \n╰‣ Page: ${page}/${Math.ceil(arrayInfo.length/numberOfOnePage)} \n╰‣ 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤  \n\`https://www.facebook.com/share/16yf6kDZ7o/\`  \n\n⭔Type !help <command> to learn usage.`;
  
  // Get bot owner info
  let admID = "61551846081032";
  
  api.getUserInfo(parseInt(admID), (err, data) => {
    if(err){ return console.log(err)}
    var obj = Object.keys(data);
    var firstname = data[obj].name.replace("@", "");
    
    // Send the message
    api.sendMessage({ 
      body: msg + footer, 
      mentions: [{
        tag: firstname,
        id: admID,
        fromIndex: 0,
      }]
    }, event.threadID, event.messageID);
  });
  return;
 }
const leiamname = getText("moduleInfo", command.config.name, command.config.description, `${(command.config.usages) ? command.config.usages : ""}`, command.config.commandCategory, command.config.cooldowns, ((command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot")), command.config.credits);

  // Format the command info in the new style
  const commandInfo = `╭─────⭓ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐈𝐍𝐅𝐎 
│✧Name: ${command.config.name}
│✧Description: ${command.config.description}
│✧Usage: ${(command.config.usages) ? command.config.usages : ""}
│✧Category: ${command.config.commandCategory}
│✧Cooldown: ${command.config.cooldowns} seconds
│✧Permission: ${((command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot"))}
│✧Credits: ${command.config.credits}
╰────────────⭓`;

  // Get bot owner info
  let admID = "61551846081032";
  
  api.getUserInfo(parseInt(admID), (err, data) => {
    if(err){ return console.log(err)}
    var obj = Object.keys(data);
    var firstname = data[obj].name.replace("@", "");
    
    // Send the message
    api.sendMessage({ 
      body: commandInfo, 
      mentions: [{
        tag: firstname,
        id: admID,
        fromIndex: 0,
      }]
    }, event.threadID, event.messageID);
  });
  return;
};
