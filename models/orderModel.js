const mongoose = require('mongoose');
const { login } = require('../middlewares/authMiddleware');

const orderSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users',

	},

	items: [
		{
			productId: {
				type: mongoose.Schema.ObjectId,
				ref: 'products',
				required: true,
			},
			quantity: {
				type: Number,
				required: true,
				min: 1,
			},
			price: {
				type: Number,
				required: true,
				min: 0,
			},
			productOrderStatus: {
				type: String,
				enum: ['pending', 'Delivered', 'placed', 'Cancelled', 'Returned'],
				default: 'pending',
			}
		},
	],
	orderStatus: {
		type: String,
		enum: ['pending', 'Delivered', 'placed', 'Cancelled', 'Returned'],
		default: 'pending',
	},
	totalAmount: {
		type: Number,
		required: true,
		min: 0,
	},
	paymentMode: {
		type: String,
		required: true,
	},
	isPaid: {
		type: Boolean,
		default: false,
	},
	paymentData: {
		type: Object,
	},
	address: {
		name: String,
		phonenumber: String,
		address: {
			type: String,
			required: true,
		},
		city: {
			type: String,
			required: true,
		},
		state: {
			type: String,
			required: true,
		},
		pincode: {
			type: Number,
			required: true,
		}
	},
	coupon: {
		type: mongoose.Schema.ObjectId,
		ref: 'Coupon',
	},
	discountAmount: {
		type: Number,
		default: 0,
	},
	finalPrice: {
		type: Number,
		required: true,
	},
	cancelledPrice: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	humanReadableID: String,

})
orderSchema.pre('save', async function (next) {
	let total = 0;
	let cancelledPrice = 0;
	this.items.forEach(item => {
		if (item.productOrderStatus !== 'Cancelled') {
			total += item.price * item.quantity;
		} else {
			cancelledPrice += item.price * item.quantity;
		}
	});

	this.totalAmount = total;
	this.finalPrice = total - this.discountAmount;
	this.cancelledPrice = cancelledPrice;

	next();
});








orderSchema.pre('save', function (next) {
	if (!this.humanReadableID) {
		// Generate the human-readable ID
		const hexString = this._id.toHexString();
		const timestamp = parseInt(hexString.substring(0, 8), 16);
		const uniqueIdentifier = Math.floor(Math.random() * 9000) + 1000;
		this.humanReadableID = `${timestamp}${uniqueIdentifier}`;
	}
	next();
});

module.exports = mongoose.model('orders', orderSchema, 'orders')



