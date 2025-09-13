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
}, {
    // Add these options to ensure table is created and maintained properly
    timestamps: true,
    tableName: 'AuctionItems',
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

// Ensure the table exists and is up to date
async function initializeDatabase() {
    try {
        // Sync the model with the database
        await AuctionItems.sync({ alter: true });
        console.log('[ DATABASE ] AuctionItems table ready.');
    } catch (error) {
        console.error('[ DATABASE ] Error initializing AuctionItems table:', error);
    }
}

// Export both the model and the initialization function
module.exports = {
    AuctionItems,
    initializeDatabase
};