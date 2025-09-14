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

    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const tempPath = path.resolve(__dirname, 'cache');
    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });
    
    const outputPath = path.resolve(tempPath, `${event.messageID}_audio.mp3`);
    
    try {
        api.sendMessage("⏳ Converting video to audio, please wait...", event.threadID, event.messageID);

        // Use a cloud conversion API
        const formData = new URLSearchParams();
        formData.append('url', attachment.url);
        formData.append('format', 'mp3');

        const response = await axios({
            method: 'post',
            url: 'https://co.wuk.sh/api/json',
            data: JSON.stringify({
                url: attachment.url,
                aFormat: "mp3"
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status === "ok" && response.data.url) {
            // Download the converted audio
            const audioResponse = await axios({
                method: 'get',
                url: response.data.url,
                responseType: 'arraybuffer'
            });

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
        return api.sendMessage("❌ An error occurred while converting the video. Please try again later.", event.threadID, event.messageID);
    }
};
