const fs = require("fs-extra");
const path = require("path");

// Auction items pool (you can add more later)
const auctionItems = [
    { name: "Golden Sword", image: fs.createReadStream(path.join(__dirname, "..", "includes", "assets", "sword.png")) },
    { name: "Mystic Shield", image: fs.createReadStream(path.join(__dirname, "..", "includes", "assets", "shield.png")) },
    { name: "Ancient Scroll", image: fs.createReadStream(path.join(__dirname, "..", "includes", "assets", "scroll.png")) }
];

// Cache file paths
const cachePath = path.join(__dirname, "..", "..", "includes", "cache");
const inventoryPath = path.join(cachePath, "auction_inventory.json");
const marketplacePath = path.join(cachePath, "auction_marketplace.json");
const auctionHistoryPath = path.join(cachePath, "auction_history.json");

// Utils
function getRandomAuctionItem() {
    return auctionItems[Math.floor(Math.random() * auctionItems.length)];
}

async function saveAuctionHistory(entry) {
    const history = await fs.readJson(auctionHistoryPath);
    history.push(entry);
    await fs.writeJson(auctionHistoryPath, history, { spaces: 2 });
}

// ========== AUCTION SYSTEM ==========
async function startNewAuction(api) {
    try {
        const item = getRandomAuctionItem();
        const startTime = Date.now();
        const endTime = startTime + (10 * 60 * 1000); // 10 minutes

        global.globalAuction = {
            isActive: true,
            currentItem: item,
            startTime,
            endTime,
            highestBid: 0,
            highestBidder: null,
            bids: []
        };

        // Get all inbox threads
        let threads = [];
        let cursor = null;

        while (true) {
            const batch = await api.getThreadList(50, cursor, ["INBOX"]);
            if (!batch || batch.length === 0) break;
            threads = threads.concat(batch);
            cursor = batch[batch.length - 1]?.timestamp;
            if (batch.length < 50) break;
        }

        console.log(`[AUCTION] Announcing auction to ${threads.length} threads`);

        // Announce in each group
        for (const thread of threads) {
            if (thread.isGroup) {
                try {
                    await api.sendMessage(
                        {
                            body: `🎉 New Auction Started! 🎉\n\n📦 Item: ${item.name}\n💎 Starting Price: 0 coins\n⏰ Ends in 10 minutes\n\nPlace your bid with: /bid <amount>`,
                            attachment: item.image
                        },
                        thread.threadID
                    );
                } catch (err) {
                    console.error(`[AUCTION ERROR] Could not announce in ${thread.threadID}`, err);
                }
            }
        }

        // Schedule auction end
        setTimeout(() => endAuction(api), 10 * 60 * 1000);
    } catch (err) {
        console.error("[AUCTION ERROR] Failed to start new auction:", err);
    }
}

async function endAuction(api) {
    const auction = global.globalAuction;
    if (!auction || !auction.isActive) return;

    auction.isActive = false;

    let message;
    if (auction.highestBidder) {
        message = `🏆 Auction ended!\n\n📦 Item: ${auction.currentItem.name}\n💰 Winning Bid: ${auction.highestBid} coins\n👤 Winner: ${auction.highestBidder}`;

        // Save to history
        await saveAuctionHistory({
            item: auction.currentItem.name,
            bid: auction.highestBid,
            winner: auction.highestBidder,
            time: new Date().toISOString()
        });
    } else {
        message = `❌ Auction ended with no bids.\n📦 Item: ${auction.currentItem.name}`;
    }

    try {
        const threads = await api.getThreadList(50, null, ["INBOX"]);
        for (const thread of threads) {
            if (thread.isGroup) {
                await api.sendMessage(message, thread.threadID);
            }
        }
    } catch (err) {
        console.error("[AUCTION ERROR] Could not send end message:", err);
    }

    // Start next auction after short delay
    setTimeout(() => startNewAuction(api), 60 * 1000);
}

// ========== COMMAND HANDLERS ==========
async function handleBid(api, event, amount) {
    if (!global.globalAuction || !global.globalAuction.isActive) {
        return api.sendMessage("⚠️ There is no active auction right now.", event.threadID);
    }

    const auction = global.globalAuction;
    const bidder = event.senderID;
    amount = parseInt(amount);

    if (isNaN(amount) || amount <= auction.highestBid) {
        return api.sendMessage(
            `⚠️ Your bid must be higher than the current highest bid (${auction.highestBid} coins).`,
            event.threadID
        );
    }

    // Record bid
    auction.highestBid = amount;
    auction.highestBidder = bidder;
    auction.bids.push({ bidder, amount });

    api.sendMessage(
        `✅ Your bid of ${amount} coins has been placed!\n\n📦 Item: ${auction.currentItem.name}\n💰 Current Highest Bid: ${auction.highestBid} coins`,
        event.threadID
    );
}

// ========== EXPORT ==========
module.exports.config = {
    name: "auction",
    version: "2.0.0",
    hasPermission: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️ 𖣘 BOT TEAM (Fixed by GPT)",
    description: "Auction system with automatic cycles",
    commandCategory: "Economy",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const sub = args[0];

    if (sub === "status") {
        if (!global.globalAuction || !global.globalAuction.isActive) {
            return api.sendMessage("⚠️ No active auction right now.", event.threadID);
        }
        const a = global.globalAuction;
        return api.sendMessage(
            `📦 Item: ${a.currentItem.name}\n💰 Highest Bid: ${a.highestBid} coins\n👤 Highest Bidder: ${a.highestBidder || "None"}\n⏰ Ends in: ${Math.round((a.endTime - Date.now()) / 1000)}s`,
            event.threadID
        );
    }

    if (sub === "bid") {
        const amount = args[1];
        if (!amount) return api.sendMessage("⚠️ Usage: /auction bid <amount>", event.threadID);
        return handleBid(api, event, amount);
    }

    // Help
    return api.sendMessage(
        "📘 Auction Commands:\n\n/auction status → Show current auction\n/auction bid <amount> → Place a bid",
        event.threadID
    );
};

// Auction cycle starter (used by auctionInit.js)
module.exports.startAuctionCycle = function (api) {
    console.log("[AUCTION] Cycle started");
    startNewAuction(api);
};
