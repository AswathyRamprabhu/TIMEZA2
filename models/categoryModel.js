const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

  categoryname: {
    type: String,
    required: true,
  },
  description: {
    type: String
  },

  image: {
    type: String,
    default: false
  },
  status: {
    type: String,
    enum: ['Listed', 'Delisted'],
    required: true,
    default: 'Listed'
  },
  offerPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

});
const Category = mongoose.model('Category', categorySchema)
module.exports = Category;