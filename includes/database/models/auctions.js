module.exports = function({ sequelize, Sequelize }) {
	let Auctions = sequelize.define('Auctions', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		currentItemId: {
			type: Sequelize.INTEGER,
			defaultValue: null
		},
		currentAuctionStart: {
			type: Sequelize.DATE,
			defaultValue: null
		},
		currentAuctionEnd: {
			type: Sequelize.DATE,
			defaultValue: null
		},
		highestBidAmount: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		highestBidderID: {
			type: Sequelize.BIGINT,
			defaultValue: null
		},
		status: {
			type: Sequelize.STRING,
			defaultValue: 'inactive' // inactive, active, ended
		},
		data: {
			type: Sequelize.JSON
		}
	});

	return Auctions;
}