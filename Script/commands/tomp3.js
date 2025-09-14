module.exports.config = {
    name: "tomp3",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "CyberBot",
    description: "Convert video to audio by replying to a video",
    commandCategory: "media",
    usages: "[Reply to a video]",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": ""
    }
};

module.exports.run = async function ({ api, event }) {
    if (event.type !== "message_reply" || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
        return api.sendMessage("❌ Please reply to a video message to convert it to audio.", event.threadID, event.messageID);
    }

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== "video") {
        return api.sendMessage("❌ Please reply to a video message, not other types of attachments.", event.threadID, event.messageID);
    }

    // Check file size (100MB limit)
    if (attachment.size > 100 * 1024 * 1024) {
        return api.sendMessage("❌ Video file is too large. Please use a video smaller than 100MB.", event.threadID, event.messageID);
    }

    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const tempPath = path.resolve(__dirname, 'cache');
    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });
    
    const outputPath = path.resolve(tempPath, `${event.messageID}_audio.mp3`);
    
    try {
        api.sendMessage("⏳ Converting video to audio, please wait...", event.threadID, event.messageID);

        // Direct download and save as MP3
        const response = await axios({
            method: 'get',
            url: attachment.url,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
            }
        });

        // Save directly as MP3
        fs.writeFileSync(outputPath, Buffer.from(response.data));

        // Send the audio file
        await api.sendMessage(
            {
                body: "✅ Here's your audio file:",
                attachment: fs.createReadStream(outputPath)
            },
            event.threadID,
            event.messageID
        );

        // Clean up
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        if (response.data && response.data.audio_url) {
            // Download the converted audio
            const audioResponse = await axios({
                method: 'get',
                url: response.data.audio_url,
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
                }
            });

            // Clean up video file
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);

            fs.writeFileSync(outputPath, Buffer.from(audioResponse.data));

            // Send the converted audio file
            await api.sendMessage(
                {
                    body: "✅ Here's your audio file:",
                    attachment: fs.createReadStream(outputPath)
                },
                event.threadID,
                event.messageID
            );

            // Clean up
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        } else {
            throw new Error("Conversion failed");
        }

    } catch (error) {
        console.error(error);
        
        // Cleanup any partial files
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        
        let errorMessage = "❌ An error occurred while converting the video.";
        if (error.response) {
            // Server responded with error
            if (error.response.status === 429) {
                errorMessage = "❌ Too many requests. Please try again in a few minutes.";
            } else if (error.response.status === 413) {
                errorMessage = "❌ Video file is too large to convert.";
            }
        } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            errorMessage = "❌ Connection error. Please check your internet connection and try again.";
        }
        
        return api.sendMessage(errorMessage, event.threadID, event.messageID);
    }
};
