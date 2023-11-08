const express = require('express');
const userRoute = express();
const bodyParser = require('body-parser');
const auth = require('../middlewares/authMiddleware');
const cache = require('../middlewares/cacheControl');

// Middleware for parsing JSON and URL-encoded data
userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));

const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');

// Define your routes and apply middleware as needed

// Landing page route with authentication check
userRoute.get('/', userController.userLandingPage);

// User sign-in routes with authentication check
userRoute.get('/signin', userController.userSignin);
userRoute.post('/signin', auth. setCacheControl, auth.login, userController.userSigninPage);

// User signout route
userRoute.get('/signout',  auth. setCacheControl, auth.checkSession, userController.userSignout);

// User signup routes
userRoute.get('/signup', userController.userSignup);
userRoute.post('/sendotp', userController.userSendOtp);
userRoute.post('/verifyotp', userController.userSignedup);
userRoute.post('/signup', userController.userSignedup);

// User forgot password routes
userRoute.get('/forgotpassword', auth.checkSession, userController.userForgotPassword);
userRoute.post('/resetpassword', auth. setCacheControl, auth.checkSession, userController.userResetPassword);

// User home route
userRoute.get('/home',auth. setCacheControl, auth.checkSession, userController.userHome);

// Product details and product lists routes
userRoute.get('/productdetails/:id',  auth. setCacheControl, auth.checkSession,userController.userProductDetails);
userRoute.get('/products', auth. setCacheControl,  auth.checkSession,userController.userProductLists);
userRoute.get('/categoryproducts/:id',  auth. setCacheControl, auth.checkSession,userController.userCategory);
userRoute.get('/sortedproducts',  auth. setCacheControl,auth.checkSession, userController.userSortPrice);
userRoute.get('/search',  auth. setCacheControl, auth.checkSession,userController.userSearch);
userRoute.get('/wishlist', auth. setCacheControl, auth.checkSession, userController.userWishlist);
userRoute.post('/addtowishlist', auth. setCacheControl, auth.checkSession, userController.addToWishlist);
userRoute.get('/wishlist/:wishlistId/product/:productId', auth. setCacheControl, auth.checkSession, userController.removeFromWishlist);

// Cart routes
userRoute.get('/cart',auth. setCacheControl, auth.checkSession,cartController.userCart);
userRoute.post('/addtocart', auth. setCacheControl, auth.checkSession, cartController.addToCart);
userRoute.get('/cart/:cartId/product/:productId',  auth. setCacheControl,auth.checkSession, cartController.removeFromCart);
userRoute.post('/updatecart', auth. setCacheControl, auth.checkSession, cartController.updateCart);

// User profile, address, and checkout routes
userRoute.get('/userprofile', auth. setCacheControl, auth. setCacheControl,auth.checkSession, userController.userProfile);
userRoute.post('/userprofile', auth. setCacheControl, auth.checkSession, userController.userProfileUpdated);
userRoute.get('/addaddress', auth. setCacheControl, auth.checkSession, userController.userAddress);
userRoute.post('/addaddress', auth. setCacheControl, auth.checkSession, userController.userAddAddress);
userRoute.get('/removeaddress', auth. setCacheControl, auth.checkSession, userController.removeAddress);
userRoute.get('/editaddress/:addressId', auth. setCacheControl, auth.checkSession, userController.userEditAddress);
userRoute.post('/editaddress', auth. setCacheControl, auth.checkSession, userController.userUpdatedAddress);
userRoute.get('/checkout/:id?', auth. setCacheControl, auth.checkSession, cartController.userCheckOut);
userRoute.post('/addNewAddress', auth. setCacheControl, auth.checkSession, userController.addNewAddress);
userRoute.get('/usecoupon',  auth. setCacheControl,auth.checkSession, userController.userAddCoupon);
userRoute.post('/addcoupon',  auth. setCacheControl,auth.checkSession, userController.userAddCouponpost);
userRoute.post('/checkoutpost', auth. setCacheControl, auth.checkSession, cartController.userCheckOutPost);

// Orders and wallet routes
userRoute.get('/orders/payment', auth. setCacheControl, auth.checkSession, orderController.userPayment);
userRoute.post('/orders/check-payment', auth. setCacheControl, auth.checkSession, orderController.checkPayment);
userRoute.get('/orderdetails/:id', auth. setCacheControl, auth.checkSession, orderController.userOrderConfirmation);
userRoute.get('/editorderdetails/:id', auth. setCacheControl, auth.checkSession, orderController.editOrderDetails);
userRoute.get('/cancelProduct/:orderId', auth. setCacheControl, auth.checkSession, orderController.cancelProduct);
userRoute.get('/orders',  auth. setCacheControl,auth.checkSession, orderController.orders);
userRoute.get('/wallet', auth. setCacheControl, auth.checkSession, userController.userWallet);

// Single order details and invoice generation routes
userRoute.get('/singleorderdetails', auth. setCacheControl, auth.checkSession, orderController.userOrderDetails);
userRoute.get('/generate-invoice/:orderId',  auth. setCacheControl,auth.checkSession, orderController.generateAndDownloadInvoice);
userRoute.get('/refer', auth. setCacheControl, auth.checkSession, userController.userRefer);
userRoute.post('/sendEmail', auth. setCacheControl, auth.checkSession, userController.sendEmail);

// Export the userRoute
module.exports = userRoute;
