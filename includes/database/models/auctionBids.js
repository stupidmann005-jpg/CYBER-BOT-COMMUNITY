module.exports = function({ sequelize, Sequelize }) {
	let AuctionBids = sequelize.define('AuctionBids', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		auctionId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		itemId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		bidderID: {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		amount: {
			type: Sequelize.BIGINT,
			allowNull: false
		},
		timestamp: {
			type: Sequelize.DATE,
			defaultValue: Sequelize.NOW
		},
		data: {
			type: Sequelize.JSON
		}
	});

	return AuctionBids;
}