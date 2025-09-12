module.exports = function({ sequelize, Sequelize }) {
	let AuctionItems = sequelize.define('AuctionItems', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: Sequelize.STRING,
			allowNull: false
		},
		description: {
			type: Sequelize.TEXT
		},
		imageURL: {
			type: Sequelize.STRING
		},
		minimumBid: {
			type: Sequelize.BIGINT,
			defaultValue: 100
		},
		ownerID: {
			type: Sequelize.BIGINT,
			defaultValue: null
		},
		isForSale: {
			type: Sequelize.BOOLEAN,
			defaultValue: false
		},
		salePrice: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		data: {
			type: Sequelize.JSON
		}
	});

	return AuctionItems;
}