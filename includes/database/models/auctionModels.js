const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../index.js');

const AuctionItems = sequelize.define('AuctionItems', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    imageURL: {
        type: DataTypes.STRING
    },
    minimumBid: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    currentBid: {
        type: DataTypes.INTEGER,
        defaultValue: null
    },
    currentBidder: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    auctionEndTime: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    }
}, {
    tableName: 'auction_items'
});

const EnabledThreads = sequelize.define('EnabledThreads', {
    threadID: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'auction_enabled_threads'
});

const AuctionBids = sequelize.define('AuctionBids', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemID: {
        type: DataTypes.INTEGER,
        references: {
            model: AuctionItems,
            key: 'id'
        }
    },
    bidderID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    tableName: 'auction_bids'
});

// Relationships
AuctionBids.belongsTo(AuctionItems, { foreignKey: 'itemID' });
AuctionItems.hasMany(AuctionBids, { foreignKey: 'itemID' });

// Make sure tables are created
(async () => {
    try {
        await sequelize.sync();
        console.log('[DATABASE] Auction tables synced successfully');
    } catch (error) {
        console.error('[DATABASE] Error syncing auction tables:', error);
    }
})();

module.exports = {
    AuctionItems,
    EnabledThreads,
    AuctionBids
};
