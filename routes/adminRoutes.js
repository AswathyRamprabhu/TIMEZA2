const express = require('express');
const adminRoute = express.Router();
const auth = require('../middlewares/authMiddleware');
const nocache = require('nocache');

const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const couponController =  require('../controllers/couponController');
const productUpload = require('../multer/product');

// Admin login and authentication routes
adminRoute.get('/login', adminController.adminLogin); // Display admin login page
adminRoute.post('/login', adminController.verifyAdmin); // Verify admin credentials and log in
adminRoute.get('/logout', auth.isAdminAuthorized, adminController.adminLogout); // Admin logout
adminRoute.get('/adminhome', auth.isAdminAuthorized, adminController.adminHome); // Admin home page

// User management routes
adminRoute.get('/userslist', auth.isAdminAuthorized, adminController.adminUsersList); // Display user list
adminRoute.post('/blockunblock', auth.isAdminAuthorized, adminController.adminBlockUnblock); // Block/unblock user

// Category management routes
adminRoute.get('/admincategory', auth.isAdminAuthorized, categoryController.adminCategory); // Display category list
adminRoute.get('/adminaddcategory', auth.isAdminAuthorized, categoryController.adminAddCategoryPage); // Display category add page
adminRoute.post('/adminaddcategory', auth.isAdminAuthorized, categoryController.adminAddCategory); // Add a new category
adminRoute.get('/admineditcategory', auth.isAdminAuthorized, categoryController.adminEditCategoryPage); // Display category edit page
adminRoute.post('/admineditcategory', auth.isAdminAuthorized, categoryController.adminEditCategory); // Edit a category
adminRoute.get('/deletecategory', auth.isAdminAuthorized, categoryController.deleteCategory); // Delete a category

// Product management routes
adminRoute.get('/adminproducts', auth.isAdminAuthorized, productController.adminProducts); // Display product list
adminRoute.get('/addproduct', auth.isAdminAuthorized, productController.adminAddProductPage); // Display product add page
adminRoute.post('/addproduct', auth.isAdminAuthorized, productUpload.array('file'), productController.adminAddProduct); // Add a new product
adminRoute.get('/editproduct', auth.isAdminAuthorized, productController.adminEditProductPage); // Display product edit page
adminRoute.post('/editproduct', auth.isAdminAuthorized, productUpload.array('file'), productController.adminEditProduct); // Edit a product
adminRoute.get('/deleteproduct', auth.isAdminAuthorized, productController.adminDeleteProduct); // Delete a product
adminRoute.post('/removeimages', auth.isAdminAuthorized, productController.adminDeleteImage); // Remove product images

// Coupon management routes
adminRoute.get('/coupons', auth.isAdminAuthorized, couponController.adminCoupons); // Display coupon list
adminRoute.get('/addcoupon', auth.isAdminAuthorized, couponController.adminAddCoupon); // Display coupon add page
adminRoute.post('/addcoupon', auth.isAdminAuthorized, couponController.adminAddCouponPost); // Add a new coupon
adminRoute.get('/coupon/edit', auth.isAdminAuthorized, couponController.adminEditCoupon); // Display coupon edit page
adminRoute.post('/editcoupon', auth.isAdminAuthorized, couponController.adminEditCouponPost); // Edit a coupon
adminRoute.get('/deletecoupon', auth.isAdminAuthorized, couponController.deleteCoupon); // Delete a coupon


// Order management routes
adminRoute.get('/adminorderlists', auth.isAdminAuthorized, adminController.adminOrderList); // Display order list
adminRoute.get('/order/edit', auth.isAdminAuthorized, adminController.adminEditOrderListPage); // Display order edit page
adminRoute.post('/admineditorder', auth.isAdminAuthorized, adminController.adminEditOrderList); // Edit an order
adminRoute.post('/updateProductStatus', auth.checkSession, adminController.updateProductStatus); // Update product status

// Sales report routes
adminRoute.get('/salesreport', auth.isAdminAuthorized, adminController.adminSalesReport); // Display sales report
adminRoute.get('/reports/sales/download/:type', auth.isAdminAuthorized, adminController.adminDownloadReports); // Download sales report

// Banner management routes
adminRoute.get('/bannerlist', auth.isAdminAuthorized, adminController.adminBannerList); // Display banner list
adminRoute.get('/addbanner', auth.isAdminAuthorized, adminController.adminAddbanner); // Display banner add page
adminRoute.post('/addbanner', productUpload.single('images'), auth.isAdminAuthorized, adminController.adminAddedBanner); // Add a new banner
adminRoute.get('/banner/edit', auth.isAdminAuthorized, adminController.adminEditBanner); // Display banner edit page
adminRoute.post('/editbanner', productUpload.single('images'), auth.isAdminAuthorized, adminController.adminEditedBanner); // Edit a banner
adminRoute.get('/deletebanner', auth.isAdminAuthorized, adminController.deleteBanner); // Delete a banner


module.exports = adminRoute;
