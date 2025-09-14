const { sequelize } = require('../index');
const { DataTypes } = require('sequelize');
const { Op } = require('sequelize');

// AuctionItems Model
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
        type: DataTypes.ENUM('pending', 'active', 'sold', 'error'),
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
    timestamps: true,
    tableName: 'AuctionItems',
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

// AuctionBids Model
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
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// AuctionQueue Model
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

// EnabledThreads Model
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

// AuctionHolds Model
const AuctionHolds = sequelize.define('AuctionHolds', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    auctionID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: true
});

// Set up relationships
AuctionBids.belongsTo(AuctionItems, { foreignKey: 'itemId' });
AuctionItems.hasMany(AuctionBids, { foreignKey: 'itemId' });
AuctionQueue.belongsTo(AuctionItems, { foreignKey: 'itemId' });
AuctionHolds.belongsTo(AuctionItems, { foreignKey: 'auctionID' });
AuctionItems.hasMany(AuctionHolds, { foreignKey: 'auctionID' });

// Add cleanup method for holds
AuctionHolds.cleanupExpired = async function() {
    const now = new Date();
    const expiredHolds = await this.findAll({
        where: {
            expiresAt: {
                [Op.lt]: now
            }
        }
    });

    for (const hold of expiredHolds) {
        await sequelize.transaction(async (t) => {
            // Return the held amount
            await Currencies.increment(
                'money',
                {
                    by: hold.amount,
                    where: { userID: hold.userID },
                    transaction: t
                }
            );

            // Delete the hold
            await hold.destroy({ transaction: t });
        });
    }
};

// Initialize database
async function initializeDatabase() {
    try {
        await sequelize.sync();
        console.log('[ DATABASE ] Auction tables synchronized successfully');
    } catch (error) {
        console.error('[ DATABASE ] Error initializing auction tables:', error);
        throw error;
    }
}

module.exports = {
    AuctionItems,
    AuctionBids,
    AuctionQueue,
    EnabledThreads,
    AuctionHolds,
    initializeDatabase
};