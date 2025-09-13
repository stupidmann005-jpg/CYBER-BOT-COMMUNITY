const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "enableauction",
    version: "1.0.0",
    hasPermssion: 1, // Admin only
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Enable auction announcements in this thread",
    commandCategory: "economy",
    usages: "",
    cooldowns: 5,
    envConfig: {}
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
        const auctionDir = path.join(__dirname, "..", "..", "includes", "cache", "auction");
        const threadsPath = path.join(auctionDir, "auction_threads.json");
        const configPath = path.join(auctionDir, "auction_config.json");

        // Ensure auction directory exists
        await fs.ensureDir(auctionDir);

        // Load or initialize threads list
        let threads = [];
        if (await fs.exists(threadsPath)) {
            threads = await fs.readJson(threadsPath);
        }

        // Load or initialize config
        let config = {
            auctionDurationMinutes: 2,
            minBidIncrement: 50,
            enableAutoStart: true
        };
        if (await fs.exists(configPath)) {
            config = await fs.readJson(configPath);
        }

        // Check if thread is already enabled
        if (threads.includes(threadID)) {
            return api.sendMessage("✅ Auctions are already enabled in this thread!", threadID, messageID);
        }

        // Add thread to list and save
        threads.push(threadID);
        await fs.writeJson(threadsPath, threads);

        // Make sure auto-start is enabled
        if (!config.enableAutoStart) {
            config.enableAutoStart = true;
            await fs.writeJson(configPath, config);
        }

        return api.sendMessage("✅ Auctions are now enabled in this thread!\n\n🎉 You'll receive notifications when:\n- New auctions start\n- Auctions end\n- Items are sold\n\nUse these commands:\n/additem2 - Add item to auction\n/bid - Place a bid\n/aqueue - View pending items", threadID, messageID);

    } catch (error) {
        console.error("Error in enableauction command:", error);
        return api.sendMessage("❌ An error occurred while enabling auctions.", threadID, messageID);
    }
};