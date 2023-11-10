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
userRoute.get('/', userController.userLandingPage);//Render the landing page

// User sign-in routes with authentication check
userRoute.get('/signin', userController.userSignin); // Render the signin page
userRoute.post('/signin', auth.setCacheControl, auth.login, userController.userSigninPage); // Process signin form

// User signout route
userRoute.get('/signout', auth.setCacheControl, auth.checkSession, userController.userSignout);//to signout

// User signup routes
userRoute.get('/signup', userController.userSignup); // Render the signup page
userRoute.post('/sendotp', userController.userSendOtp); // Send OTP for verification
userRoute.post('/verifyotp', userController.userSignedup); // Verify OTP and complete signup
userRoute.post('/signup', userController.userSignedup); // Process signup form

// User forgot password routes
userRoute.get('/forgotpassword', auth.setCacheControl, userController.userForgotPassword); // Render the forgot password page
userRoute.post('/resetpassword', auth.setCacheControl, userController.userResetPassword); // Process password reset

// User home route
userRoute.get('/home', auth.setCacheControl, auth.checkSession, userController.userHome);//Render home page after successfull login

// Product details and product lists routes
userRoute.get('/productdetails/:id', auth.setCacheControl, auth.checkSession, userController.userProductDetails);//Show single product detail
userRoute.get('/products', auth.setCacheControl, auth.checkSession, userController.userProductLists);//show product list page for filter
userRoute.get('/categoryproducts/:id', auth.setCacheControl, auth.checkSession, userController.userCategory);//to show the product based on category
userRoute.get('/sortedproducts', auth.setCacheControl, auth.checkSession, userController.userSortPrice);//to show product based on price sort
userRoute.get('/search', auth.setCacheControl, auth.checkSession, userController.userSearch);// to search product
userRoute.get('/wishlist', auth.setCacheControl, auth.checkSession, userController.userWishlist);//to show wishlist
userRoute.post('/addtowishlist', auth.setCacheControl, auth.checkSession, userController.addToWishlist);//to add the product to wishlist
userRoute.get('/wishlist/:wishlistId/product/:productId', auth.setCacheControl, auth.checkSession, userController.removeFromWishlist);//to remove product from wishlist

// Cart routes
userRoute.get('/cart', auth.setCacheControl, auth.checkSession, cartController.userCart); // Render user's cart
userRoute.post('/addtocart', auth.setCacheControl, auth.checkSession, cartController.addToCart); // Add product to cart
userRoute.get('/cart/:cartId/product/:productId', auth.setCacheControl, auth.checkSession, cartController.removeFromCart); // Remove product from cart
userRoute.post('/updatecart', auth.setCacheControl, auth.checkSession, cartController.updateCart); // Update cart

// User profile, address, and checkout routes
userRoute.get('/userprofile', auth.setCacheControl, auth.checkSession, userController.userProfile); // Render user profile
userRoute.post('/userprofile', auth.setCacheControl, auth.checkSession, userController.userProfileUpdated); // Update user profile
userRoute.get('/addaddress', auth.setCacheControl, auth.checkSession, userController.userAddress); // Render add address page
userRoute.post('/addaddress', auth.setCacheControl, auth.checkSession, userController.userAddAddress); // Add new address
userRoute.get('/removeaddress', auth.setCacheControl, auth.checkSession, userController.removeAddress); // Remove address
userRoute.get('/editaddress/:addressId', auth.setCacheControl, auth.checkSession, userController.userEditAddress); // Render edit address page
userRoute.post('/editaddress', auth.setCacheControl, auth.checkSession, userController.userUpdatedAddress); // Update address
userRoute.get('/checkout/:id?', auth.setCacheControl, auth.checkSession, cartController.userCheckOut); // Render checkout page
userRoute.post('/addNewAddress', auth.setCacheControl, auth.checkSession, userController.addNewAddress); // Add new address during checkout
userRoute.get('/usecoupon', auth.setCacheControl, auth.checkSession, userController.userAddCoupon); // Render use coupon page
userRoute.post('/addcoupon', auth.setCacheControl, auth.checkSession, userController.userAddCouponpost); // Add coupon during checkout
userRoute.post('/checkoutpost', auth.setCacheControl, auth.checkSession, cartController.userCheckOutPost); // Process checkout

// Orders and wallet routes
userRoute.get('/orders/payment', auth.setCacheControl, auth.checkSession, orderController.userPayment); // Render payment page
userRoute.post('/orders/check-payment', auth.setCacheControl, auth.checkSession, orderController.checkPayment); // Check payment status
userRoute.get('/orderdetails/:id', auth.setCacheControl, auth.checkSession, orderController.userOrderConfirmation); // Render order confirmation
userRoute.get('/editorderdetails/:id', auth.setCacheControl, auth.checkSession, orderController.editOrderDetails); // Render edit order details
userRoute.get('/cancelProduct/:orderId', auth.setCacheControl, auth.checkSession, orderController.cancelProduct); // Cancel product from order
userRoute.get('/orders', auth.setCacheControl, auth.checkSession, orderController.orders); // Render order history
userRoute.get('/wallet', auth.setCacheControl, auth.checkSession, userController.userWallet); // Render wallet page

// Single order details and invoice generation routes
userRoute.get('/singleorderdetails', auth.setCacheControl, auth.checkSession, orderController.userOrderDetails); // Render single order details
userRoute.get('/generate-invoice/:orderId', auth.setCacheControl, auth.checkSession, orderController.generateAndDownloadInvoice); // Generate and download invoice
userRoute.get('/refer', auth.setCacheControl, auth.checkSession, userController.userRefer); // Render refer page
userRoute.post('/sendEmail', auth.setCacheControl, auth.checkSession, userController.sendEmail); // Send email

// Export the userRoute
module.exports = userRoute;
