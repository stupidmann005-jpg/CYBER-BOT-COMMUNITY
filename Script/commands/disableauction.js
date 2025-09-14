const { EnabledThreads } = require('../../includes/database/models');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "disableauction",
    version: "1.0.0",
    hasPermssion: 1, // Group admin only
    credits: "CyberBot",
    description: "Disable auction announcements in this thread",
    commandCategory: "economy",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID } = event;

    try {
        // Update both database and JSON file
        const threadsFilePath = path.join(__dirname, '..', '..', 'includes', 'cache', 'auction', 'auction_threads.json');
        
        let enabledThreads = [];
        try {
            enabledThreads = await fs.readJson(threadsFilePath);
        } catch (err) {
            enabledThreads = [];
        }

        // Remove from EnabledThreads database
        await EnabledThreads.update(
            { enabled: false },
            { where: { threadID: threadID } }
        );

        // Remove from JSON file
        const index = enabledThreads.indexOf(threadID);
        if (index > -1) {
            enabledThreads.splice(index, 1);
            await fs.writeJson(threadsFilePath, enabledThreads, { spaces: 2 });
        }

        return api.sendMessage(
            '❌ Auctions have been disabled in this group.\n' +
            'You will no longer receive auction announcements.\n\n' +
            'Use /enableauction to turn them back on.',
            threadID
        );
    } catch (error) {
        console.error('Error in disableauction command:', error);
        return api.sendMessage('❌ Failed to disable auctions. Please try again.', threadID);
    }
}