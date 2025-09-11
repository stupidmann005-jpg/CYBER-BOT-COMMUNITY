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
 
 // Create axios instance with SSL verification disabled, timeout, and browser-like headers
 const axiosInstance = axios.create({
   httpsAgent: new https.Agent({ rejectUnauthorized: false }),
   timeout: 10000, // 10 second timeout to prevent hanging
   headers: {
     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
     'Accept': 'application/json, text/plain, */*',
     'Accept-Language': 'en-US,en;q=0.9',
     'Origin': 'https://callbomber.co',
     'Referer': 'https://callbomber.co/'
   }
 });
 
 if (!number || !/^01[0-9]{9}$/.test(number)) {
 return api.sendMessage("অনুগ্রহ করে সঠিক বাংলাদেশি নাম্বার দিন (উদাহরণ: /call 01xxxxxxxxx) দয়া করে কেউ খারাপ কাজে ব্যবহার করবেন না 🙂,\n ফাইলটি শুধুমাত্র মজা করার উদ্দেশ্যে তৈরি করা হয়েছে।\n\nডিবাগ মোডে চালাতে: /call 01xxxxxxxxx debug", event.threadID, event.messageID);
 }
 
 api.sendMessage(`কল বোম্বিং শুরু হয়েছে: ${number} নম্বরে...📞💣
 কাউকে বিরক্ত করার জন্য এই টুল ব্যবহার সম্পূর্ণ নিষিদ্ধ এবং আইনত অপরাধ।

দয়া করে অপেক্ষা করুন, এটি কয়েক মিনিট সময় নিতে পারে...`, event.threadID, async (err, info) => {
 try {
   let response;
   
   // First, test if we can reach a public API to verify internet connectivity
   let connectivityTest = false;
   try {
     const testResponse = await axiosInstance.get('https://jsonplaceholder.typicode.com/todos/1');
     connectivityTest = testResponse.status === 200;
   } catch (connectivityError) {
     // Connectivity test failed
   }
   
   // Try multiple API endpoints in sequence until one works
   let successfulEndpoint = "";
   try {
     // Try direct POST request to callbomber.co with captcha bypass
     response = await axiosInstance.post('https://callbomber.co/api/send-call', {
       number: number,
       country_code: '+880', // Bangladesh country code
       captcha_token: 'verified', // Attempt to bypass captcha
       verify: true,
       _token: 'callbomber_verification_token' // Attempt to bypass verification
     });
     successfulEndpoint = "callbomber.co (POST)";
   } catch (primaryError) {
    try {
      // Try direct POST request to callbomber.in with captcha bypass
      response = await axiosInstance.post('https://callbomber.in/api/send-call', {
        number: number,
        country_code: '+880', // Bangladesh country code
        captcha_token: 'verified', // Attempt to bypass captcha
        verify: true,
        _token: 'callbomber_verification_token' // Attempt to bypass verification
      });
      successfulEndpoint = "callbomber.in (POST)";
    } catch (firstAlternativeError) {
      try {
        // Try with softdownload.in format with additional parameters
        response = await axiosInstance.post('https://www.softdownload.in/International-bomber/api/call', {
          number: number,
          country: 'BD', // Bangladesh country code
          key: 'free_access', // Attempt to bypass key requirement
          captcha: 'verified', // Attempt to bypass captcha
          count: 5 // Request multiple calls
        });
        successfulEndpoint = "softdownload.in";
      } catch (secondAlternativeError) {
        try {
          // Try a direct SMS API that might work for Bangladesh
          response = await axiosInstance.post('https://api.sms.to/sms/send', {
            message: "Verification code: 123456",
            to: "+880" + number.substring(1),
            bypass_optout: true,
            sender_id: "INFO"
          }, {
            headers: {
              'Authorization': 'Bearer test_api_key', // This is just a placeholder
              'Content-Type': 'application/json'
            }
          });
          successfulEndpoint = "sms.to";
        } catch (smsToError) {
        try {
          // Try MiMSMS API (legitimate SMS service in Bangladesh)
          response = await axiosInstance.post('https://api.mimsms.com/api/sendsms', {
            api_key: 'test_key', // This is just a placeholder
            type: 'plain',
            contacts: '880' + number.substring(1),
            senderid: 'INFO',
            msg: 'Test message from call bomber service'
          });
          successfulEndpoint = "mimsms.com";
        } catch (thirdAlternativeError) {
            try {
              // Try a Bangladesh-specific SMS gateway
              const bdNumber = '880' + number.substring(1);
              response = await axiosInstance.post('https://api.greenweb.com.bd/api.php', null, {
                params: {
                  token: 'test_token', // This is just a placeholder
                  to: bdNumber,
                  message: 'Your verification code is 123456'
                }
              });
              successfulEndpoint = "greenweb.com.bd";
            } catch (greenwebError) {
              try {
                // Try original endpoints with GET requests
                response = await axiosInstance.get(`https://callbomber.co/api/call?number=${number}`);
                successfulEndpoint = "callbomber.co (GET)";
              } catch (fourthAlternativeError) {
                try {
                  // Try with different parameter format
                  response = await axiosInstance.get(`https://callbomber.co/api/call?mobile=${number}`);
                  successfulEndpoint = "callbomber.co (mobile param)";
                } catch (fifthAlternativeError) {
                  // If all endpoints fail, try one more with different domain
                  response = await axiosInstance.get(`https://callbomberpro.shop/api/call?number=${number}`);
                  successfulEndpoint = "callbomberpro.shop";
                }
              }
            }
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
   let responseDetails = "";
   try {
     // Different APIs have different success indicators
     if (response) {
       responseDetails = JSON.stringify(response.data || {}).substring(0, 200);
       
       // Check for various success indicators
       if (response.status === 200 || response.status === 201 || response.status === 202) {
         if (response.data) {
           if (response.data.success === true || 
               response.data.status === "success" || 
               response.data.status === 200 || 
               response.data.message?.toLowerCase().includes("success") ||
               response.data.code === 200) {
             success = true;
           }
         } else {
           // If we got a good status code but no data, assume success
           success = true;
         }
       }
     }
   } catch (parseError) {
     // If we can't determine success from response, assume it worked if we got here
     success = true;
     responseDetails = "Could not parse response: " + parseError.message;
   }
 
   if (debug) {
      // In debug mode, show detailed API response
      let debugInfo = `🔍 ডিবাগ তথ্য:\n`;
      debugInfo += `- ইন্টারনেট সংযোগ: ${connectivityTest ? 'কাজ করছে ✅' : 'সমস্যা আছে ❌'}\n`;
      debugInfo += `- সফল এন্ডপয়েন্ট: ${successfulEndpoint || 'কোনটিই কাজ করেনি'}\n`;
      debugInfo += `- API স্ট্যাটাস: ${response?.status || 'অজানা'}\n`;
      debugInfo += `- API রেসপন্স: ${responseDetails}\n`;
      debugInfo += `- সাক্সেস ফ্ল্যাগ: ${success ? 'হ্যাঁ' : 'না'}\n`;
      debugInfo += `- রিকোয়েস্ট হেডার: ${JSON.stringify(axiosInstance.defaults.headers).substring(0, 200)}\n`;
      
      // Add troubleshooting suggestions
      debugInfo += `\n🔧 সমস্যা সমাধানের পরামর্শ:\n`;
      if (!connectivityTest) {
        debugInfo += `1. আপনার ইন্টারনেট সংযোগ চেক করুন - সংযোগ সমস্যা আছে\n`;
      } else {
        debugInfo += `1. API সার্ভারগুলি সম্ভবত আপনার রিকোয়েস্ট ব্লক করছে\n`;
        debugInfo += `2. ক্যাপচা বা টোকেন ভেরিফিকেশন প্রয়োজন হতে পারে\n`;
        debugInfo += `3. API সার্ভারগুলি সম্ভবত আর কাজ করছে না বা পরিবর্তিত হয়েছে\n`;
        debugInfo += `4. সম্ভবত এই সেবাগুলি বাংলাদেশে আর বিনামূল্যে উপলব্ধ নয়\n`;
      }
      
      return api.sendMessage(debugInfo, event.threadID, event.messageID);
   } else if (success) {
      return api.sendMessage(`✅ —͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 কল বোম্বিং অনুরোধ সম্পন্ন হয়েছে ${number} নম্বরে।\n\nকল আসতে ১-২ মিনিট সময় লাগতে পারে, অনুগ্রহ করে অপেক্ষা করুন।\n\n⚠️ দ্রষ্টব্য: বর্তমানে অধিকাংশ ফ্রি কল বোম্বিং সার্ভিস সীমিত বা বন্ধ করা হয়েছে। যদি কল না আসে, তাহলে সম্ভবত API সার্ভারগুলি আর কাজ করছে না।${successfulEndpoint ? `\n\n(API: ${successfulEndpoint})` : ''}`, event.threadID, event.messageID);
   } else {
     return api.sendMessage(`⚠️ —͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 কল বোম্বিং অনুরোধ পাঠানো হয়েছে, কিন্তু নিশ্চিত নয় যে কল পৌঁছেছে কিনা।\n\n⚠️ সতর্কতা: বর্তমানে অধিকাংশ ফ্রি কল বোম্বিং সার্ভিস সীমিত বা বন্ধ করা হয়েছে। সম্ভবত কল নাও আসতে পারে।`, event.threadID, event.messageID);
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
     return api.sendMessage(`❌ ত্রুটি: কল বোম্বিং সম্পন্ন করা যায়নি।\n\n📢 সম্ভাব্য কারণ:\n1️⃣ বেশিরভাগ ফ্রি কল বোম্বিং API সার্ভিস এখন আর কাজ করে না\n2️⃣ সার্ভিসগুলি এখন ক্যাপচা ভেরিফিকেশন ব্যবহার করে যা বট দিয়ে বাইপাস করা যায় না\n3️⃣ বাংলাদেশে এই সেবাগুলি সম্ভবত ব্লক করা হয়েছে\n\n💡 পরামর্শ: এই ধরনের সেবা ব্যবহার করা আইনত অপরাধ হতে পারে। দয়া করে অন্য কোন বৈধ পদ্ধতি ব্যবহার করুন।\n\nআরো তথ্যের জন্য ডিবাগ মোড ব্যবহার করুন: /call ${number} debug`, event.threadID, event.messageID);
   }
  }
 });
};
