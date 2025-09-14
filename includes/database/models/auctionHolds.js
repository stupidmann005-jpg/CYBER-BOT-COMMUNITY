const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

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

// Add cleanup method
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

module.exports = AuctionHolds;