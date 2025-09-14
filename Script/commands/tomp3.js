module.exports.config = {
    name: "tomp3",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "CyberBot",
    description: "Convert video to audio by replying to a video",
    commandCategory: "media",
    usages: "[Reply to a video]",
    cooldowns: 5,
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
    const ffmpeg = require("fluent-ffmpeg");

    const tempVideoPath = path.resolve(__dirname, `cache/${event.messageID}_video.mp4`);
    const tempAudioPath = path.resolve(__dirname, `cache/${event.messageID}_audio.mp3`);

    try {
        // Download the video
        const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
        fs.writeFileSync(tempVideoPath, Buffer.from(response.data, "utf-8"));

        // Convert video to audio using ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(tempVideoPath)
                .toFormat("mp3")
                .on("end", resolve)
                .on("error", reject)
                .save(tempAudioPath);
        });

        // Send the converted audio file
        await api.sendMessage(
            {
                body: "✅ Here's your audio file:",
                attachment: fs.createReadStream(tempAudioPath)
            },
            event.threadID,
            event.messageID
        );

        // Clean up temporary files
        fs.unlinkSync(tempVideoPath);
        fs.unlinkSync(tempAudioPath);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ An error occurred while converting the video. Please try again later.", event.threadID, event.messageID);
    }
};