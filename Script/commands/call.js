module.exports.config = {
 name: "call",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️", //don't change my credit 
 description: "কল বোম্বার, শুধুমাত্র বাংলাদেশি নাম্বারের জন্য",
 commandCategory: "Tool",
 usages: "/call 01xxxxxxxxx",
 cooldowns: 15,
 dependencies: { "axios": "" }
};
 
module.exports.run = async ({ api, event, args }) => {
 const axios = require('axios');
 const https = require('https');
 const number = args[0];
 const debug = args[1] === "debug";
 
 // Create axios instance with SSL verification disabled and timeout
 const axiosInstance = axios.create({
   httpsAgent: new https.Agent({ rejectUnauthorized: false }),
   timeout: 10000 // 10 second timeout to prevent hanging
 });
 
 if (!number || !/^01[0-9]{9}$/.test(number)) {
 return api.sendMessage("অনুগ্রহ করে সঠিক বাংলাদেশি নাম্বার দিন (উদাহরণ: /call 01xxxxxxxxx) দয়া করে কেউ খারাপ কাজে ব্যবহার করবেন না 🙂,\n ফাইলটি শুধুমাত্র মজা করার উদ্দেশ্যে তৈরি করা হয়েছে।\n\nডিবাগ মোডে চালাতে: /call 01xxxxxxxxx debug", event.threadID, event.messageID);
 }
 
 api.sendMessage(`কল বোম্বিং শুরু হয়েছে: ${number} নম্বরে...📞💣\n কাউকে বিরক্ত করার জন্য এই টুল ব্যবহার সম্পূর্ণ নিষিদ্ধ এবং আইনত অপরাধ।`, event.threadID, async (err, info) => {
 try {
  let response;
  
  // Try multiple API endpoints in sequence until one works
  let successfulEndpoint = "";
  try {
    // New primary endpoint
    response = await axiosInstance.get(`https://nextbomb.in/api/call?number=${number}`);
    successfulEndpoint = "nextbomb.in";
  } catch (primaryError) {
    try {
      // If primary fails, try first alternative API endpoint
      response = await axiosInstance.get(`https://callbomber.in/api/call?number=${number}`);
      successfulEndpoint = "callbomber.in";
    } catch (firstAlternativeError) {
      try {
        // If first alternative fails, try second alternative API endpoint
        response = await axiosInstance.get(`https://callbomber.co/api/call?number=${number}`);
        successfulEndpoint = "callbomber.co";
      } catch (secondAlternativeError) {
        try {
          // If second alternative fails, try third alternative API endpoint
          response = await axiosInstance.get(`https://www.callbomberz.in/api/call?phone=${number}`);
          successfulEndpoint = "callbomberz.in";
        } catch (thirdAlternativeError) {
          try {
            // If third alternative fails, try fourth alternative API endpoint
            response = await axiosInstance.get(`https://callbomberpro.shop/api/call?number=${number}`);
            successfulEndpoint = "callbomberpro.shop";
          } catch (fourthAlternativeError) {
            // If all endpoints fail, try one more with different parameter format
            response = await axiosInstance.get(`https://callbomber.co/api/call?mobile=${number}`);
            successfulEndpoint = "callbomber.co (mobile param)";
          }
        }
      }
    }
  }
  
  setTimeout(() => {
  api.unsendMessage(info.messageID);
  }, 90000);
 
 // Check if response contains success information
   let success = false;
   try {
     if (response && (response.data.success || response.status === 200)) {
       success = true;
     }
   } catch (parseError) {
     // If we can't determine success from response, assume it worked if we got here
     success = true;
   }
 
   if (debug) {
      // In debug mode, show detailed API response
      let debugInfo = `🔍 ডিবাগ তথ্য:\n`;
      debugInfo += `- সফল এন্ডপয়েন্ট: ${successfulEndpoint || 'কোনটিই কাজ করেনি'}\n`;
      debugInfo += `- API স্ট্যাটাস: ${response?.status || 'অজানা'}\n`;
      debugInfo += `- API রেসপন্স: ${JSON.stringify(response?.data || {}).substring(0, 200)}\n`;
      debugInfo += `- সাক্সেস ফ্ল্যাগ: ${success ? 'হ্যাঁ' : 'না'}\n`;
      return api.sendMessage(debugInfo, event.threadID, event.messageID);
   } else if (success) {
      return api.sendMessage(`✅ —͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 কল বোম্বিং সম্পন্ন হয়েছে ${number} নম্বরে।\n\nকল আসতে ১-২ মিনিট সময় লাগতে পারে, অনুগ্রহ করে অপেক্ষা করুন।${successfulEndpoint ? `\n\n(API: ${successfulEndpoint})` : ''}`, event.threadID, event.messageID);
   } else {
     return api.sendMessage(`⚠️ —͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 কল বোম্বিং অনুরোধ পাঠানো হয়েছে, কিন্তু নিশ্চিত নয় যে কল পৌঁছেছে কিনা। কল আসতে ১-২ মিনিট সময় লাগতে পারে।`, event.threadID, event.messageID);
   }
 } catch (error) {
   if (debug) {
     // In debug mode, show detailed error information
     let debugError = `🔍 ডিবাগ ত্রুটি তথ্য:\n`;
     debugError += `- ত্রুটি প্রকার: ${error.name || 'অজানা'}\n`;
     debugError += `- ত্রুটি বার্তা: ${error.message || 'কোন বার্তা নেই'}\n`;
     debugError += `- স্ট্যাক ট্রেস: ${(error.stack || '').substring(0, 200)}\n`;
     debugError += `\nঅনুগ্রহ করে এই তথ্য ডেভেলপারকে জানান।`;
     return api.sendMessage(debugError, event.threadID, event.messageID);
   } else {
     return api.sendMessage(`❌ ত্রুটি: কল বোম্বিং সম্পন্ন করা যায়নি। সম্ভবত API সার্ভারগুলি কাজ করছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।\n\nবিস্তারিত ত্রুটি: ${error.message}\n\nআরো তথ্যের জন্য ডিবাগ মোড ব্যবহার করুন: /call ${number} debug`, event.threadID, event.messageID);
   }
  }
 });
};
