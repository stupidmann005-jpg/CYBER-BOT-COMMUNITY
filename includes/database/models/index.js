const { sequelize } = require('../index');
const { DataTypes } = require('sequelize');

// Define AuctionItems model
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
        type: DataTypes.BIGINT,
        defaultValue: 100
    },
    currentBid: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    currentBidder: {
        type: DataTypes.STRING
    },
    ownerID: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    auctionStartTime: {
        type: DataTypes.DATE
    },
    auctionEndTime: {
        type: DataTypes.DATE
    }
});

// Define AuctionBids model
const AuctionBids = sequelize.define('AuctionBids', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bidderID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
});

// Define AuctionQueue model for persistent queue
const AuctionQueue = sequelize.define('AuctionQueue', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// Define EnabledThreads model for persistent thread settings
const EnabledThreads = sequelize.define('EnabledThreads', {
    threadID: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

// Set up relationships
AuctionBids.belongsTo(AuctionItems, { foreignKey: 'itemId' });
AuctionItems.hasMany(AuctionBids, { foreignKey: 'itemId' });
AuctionQueue.belongsTo(AuctionItems, { foreignKey: 'itemId' });

// Create tables if they don't exist
sequelize.sync();

module.exports = {
    AuctionItems,
    AuctionBids,
    AuctionQueue,
    EnabledThreads
};