const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const Product = mongoose.model('products');

const updateProductPriceMiddleware = async (next) => {
  try {
    const category = await Category.findById(this.categoryname);

    if (category && category.offerPercentage > 0) {
      const priceReduction = (category.offerPercentage / 100) * this.mrp;
      this.price = this.mrp - priceReduction;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = updateProductPriceMiddleware;
