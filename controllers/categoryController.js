const sharp = require('sharp');
const { configDotenv } = require('dotenv')
const Category = require('../models/categoryModel')
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const categoryHelper = require('../helpers/categoryHelper')


///admin side

////////////////////////////////////////////////// ADMIN SIDE CATEGORY MANAGEMENT ///////////////////////////////////////////////////////////// 

////////////////to show admin side category page
const adminCategory = async (req, res) => {     // to display the category list page for admin
  try {
    const category = await categoryModel.find()
    res.render('admin/adminCategory', { data: category })
  } catch (error) {
    console.error(error.message);
  }
}




///////////////to dispaly admin side  new category creating page
const adminAddCategoryPage = async (req, res) => {     // to render add category page of admin
  try {
    res.render('admin/adminAddCategory')
  } catch (error) {
    console.error(error.message);
  }
}




////////////////to create new catrgory
const adminAddCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    await categoryHelper.addCategory(categoryData);
    res.redirect('/admin/admincategory');
  } catch (error) {
    console.log('Failed to add Category:', error);
    res.status(500).send('Internal Server Error');
  }
}





//////////////////to dispaly admin side category editing page
const adminEditCategoryPage = async (req, res) => {
  try {
    const categoryId = req.query._id;
    const category = await categoryModel.findById(categoryId);

    res.render('admin/adminEditCategory', { category });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}





/////////////////////to edit category
const adminEditCategory = async (req, res) => {
  try {
    const categoryId = req.body.id;
    const updatedCategoryData = {
      categoryname: req.body.categoryname,
      description: req.body.description,
      status: req.body.status,
      offerPercentage: req.body.offerPercentage,
    };

    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      updatedCategoryData,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productsToUpdate = await productModel.find({ categoryname: updatedCategory._id });

    if (productsToUpdate.length > 0) {
      productsToUpdate.forEach((product) => {
        if (updatedCategory.offerPercentage > 0) {
          const priceReduction = (updatedCategory.offerPercentage / 100) * product.mrp;
          product.price = product.mrp - priceReduction;
        } else if (updatedCategory.offerPercentage === 0 && product.productOffer > 0) {
          product.price = product.productOffer;
        } else {

          product.price = product.mrp;
        }
      });

      await Promise.all(productsToUpdate.map((product) => product.save()));
    }

    res.redirect("/admin/admincategory");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};





/////////////////to delete category
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.query._id;

    // Delete the category with the specified ID
    await categoryModel.deleteOne({ _id: categoryId });

    res.redirect('/admin/admincategory');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}






module.exports = {
  adminCategory,
  adminAddCategoryPage,
  adminAddCategory,
  adminEditCategoryPage,
  adminEditCategory,
  deleteCategory,
}