const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../database');

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
        defaultValue: null
    },
    currentBidder: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    ownerID: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'sold'),
        defaultValue: 'pending'
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    auctionStartTime: {
        type: DataTypes.BIGINT,
        defaultValue: null
    },
    auctionEndTime: {
        type: DataTypes.BIGINT,
        defaultValue: null
    },
    soldPrice: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    soldTo: {
        type: DataTypes.STRING,
        defaultValue: null
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
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// Define relationships
AuctionBids.belongsTo(AuctionItems, { foreignKey: 'itemId' });
AuctionItems.hasMany(AuctionBids, { foreignKey: 'itemId' });

module.exports = {
    AuctionItems,
    AuctionBids
};
