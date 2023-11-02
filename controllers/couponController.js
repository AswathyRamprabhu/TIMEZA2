mongoose = require('mongoose');
const orderModel = require('../models/orderModel')
const couponModel = require('../models/couponModel')



/////////////////////////////////// ADMIN SIDE COUPON LIST ///////////////////////////////////////////

////////////////////////to show the coupon list
const adminCoupons = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const ITEMS_PER_PAGE = 10;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await couponModel.countDocuments();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const coupon = await couponModel.find().skip(skipItems).limit(ITEMS_PER_PAGE);

    res.render("admin/adminCoupons", { coupon, currentPage: page, totalPages: totalPages });
  } catch (error) {
    console.log(error.message);
  }
}




//////////////////////to show admin create coupon page
const adminAddCoupon = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.render("admin/adminAddCoupon");
  } catch (error) {
    console.log(error.message);
  }
}




////////////////////to create new coupon from admin side
const adminAddCouponPost = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const couponData = req.body;
    await couponModel.create(couponData);
    res.redirect("/admin/coupons");
  } catch (error) {
    console.log(error.message);
  }
}




////////////////////to show edit coupon page
const adminEditCoupon = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const couponId = req.query._id;
    const coupon = await couponModel.findById(couponId);
    res.render("admin/adminEditCoupon", { coupon });
  } catch (error) {
    console.log(error.message);
  }
}



/////////////////to edit the existing coupon
const adminEditCouponPost = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const couponId = req.body.id;
    const updatedCoupon = await couponModel.findById(couponId);

    updatedCoupon.code = req.body.code;
    updatedCoupon.description = req.body.description;
    updatedCoupon.discountType = req.body.discountType;
    updatedCoupon.discountAmount = req.body.discountAmount;
    updatedCoupon.minimumAmount = req.body.minimumAmount;
    updatedCoupon.expirationDate = req.body.expirationDate;
    updatedCoupon.maxRedemptions = req.body.maxRedemptions;

    await updatedCoupon.save();
    res.redirect("/admin/coupons");
  } catch (error) {
    console.log(error.message);
  }
}




module.exports = {
  adminCoupons,
  adminAddCoupon,
  adminAddCouponPost,
  adminEditCoupon,
  adminEditCouponPost,
}