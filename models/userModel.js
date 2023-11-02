
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phonenumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  address: [
    {
      name: String,
      email: String,
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
      },
    },
  ],
  wallet: {
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        ID: {
          type: String,
          required: true,

        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ['Debit', 'Credit'],
        },

        amount: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});

module.exports = mongoose.model("users", userSchema, "users");
