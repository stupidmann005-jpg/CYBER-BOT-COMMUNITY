const fs = require('fs-extra');
const path = require('path');

class AuctionError extends Error {
    constructor(message, code, data = {}) {
        super(message);
        this.name = 'AuctionError';
        this.code = code;
        this.data = data;
    }
}

class AuctionManager {
    constructor(api) {
        this.api = api;
        this.errorLog = path.join(__dirname, '..', 'cache', 'auction', 'error_log.json');
    }

    async logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                stack: error.stack
            },
            context
        };

        try {
            let logs = [];
            if (await fs.exists(this.errorLog)) {
                logs = await fs.readJson(this.errorLog);
            }
            logs.push(errorEntry);
            await fs.writeJson(this.errorLog, logs.slice(-100), { spaces: 2 }); // Keep last 100 errors
        } catch (e) {
            console.error('Failed to log error:', e);
        }
    }

    async notifyAdmins(message, error = null) {
        try {
            const configPath = path.join(__dirname, '..', 'cache', 'auction', 'auction_config.json');
            const config = await fs.readJson(configPath);
            const adminIds = config.adminIds || [];

            for (const adminId of adminIds) {
                try {
                    await this.api.sendMessage(
                        `🚨 Admin Notification:\n${message}${error ? `\n\nError: ${error.message}` : ''}`,
                        adminId
                    );
                } catch (e) {
                    console.error(`Failed to notify admin ${adminId}:`, e);
                }
            }
        } catch (e) {
            console.error('Failed to send admin notifications:', e);
        }
    }

    async handleError(error, threadID, context = {}) {
        await this.logError(error, context);

        let userMessage = "An error occurred. Please try again later.";
        let shouldNotifyAdmin = true;

        switch (error.code) {
            case 'BID_TOO_LOW':
                userMessage = `Your bid must be at least $${error.data.minimumBid}.`;
                shouldNotifyAdmin = false;
                break;
            case 'INSUFFICIENT_FUNDS':
                userMessage = `You don't have enough money. Required: $${error.data.required}, Balance: $${error.data.balance}`;
                shouldNotifyAdmin = false;
                break;
            case 'AUCTION_ENDED':
                userMessage = "This auction has already ended.";
                shouldNotifyAdmin = false;
                break;
            case 'DATABASE_ERROR':
                userMessage = "A database error occurred. Please try again.";
                break;
            case 'TRANSACTION_FAILED':
                userMessage = "Failed to process the transaction. Please try again.";
                break;
        }

        if (threadID) {
            await this.api.sendMessage(userMessage, threadID);
        }

        if (shouldNotifyAdmin) {
            await this.notifyAdmins(
                `Error in ${context.command || 'auction system'} (${error.code || 'UNKNOWN'})`,
                error
            );
        }
    }

    // Utility method to send auction notifications
    async notifyAuction(message, imageURL = null) {
        try {
            const threads = await this.getEnabledThreads();
            for (const threadID of threads) {
                try {
                    if (imageURL) {
                        const stream = await global.utils.getStreamFromURL(imageURL);
                        await this.api.sendMessage({
                            body: message,
                            attachment: stream
                        }, threadID);
                    } else {
                        await this.api.sendMessage(message, threadID);
                    }
                } catch (e) {
                    console.error(`Failed to send auction notification to thread ${threadID}:`, e);
                }
            }
        } catch (e) {
            console.error('Failed to send auction notifications:', e);
        }
    }

    async getEnabledThreads() {
        const configPath = path.join(__dirname, '..', 'cache', 'auction', 'auction_threads.json');
        try {
            if (await fs.exists(configPath)) {
                return await fs.readJson(configPath);
            }
        } catch (error) {
            console.error('Error reading enabled threads:', error);
        }
        return [];
    }
}

module.exports = {
    AuctionError,
    AuctionManager
};