const userRoute = require('../routes/userRoutes')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const userHelper = require('../helpers/userHelper')
const bcrypt = require('bcrypt')
const { configDotenv } = require('dotenv')
const nodemailer = require('nodemailer');
const config = require('../config/config')
const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel')
const couponModel = require("../models/couponModel");
const wishlistModel = require("../models/wishlistModel");
const bannerModel = require("../models/bannerModel");
var emailOtp;



///////////////////////////////////////////////////USER  ACCESS TO WEBPAGE //////////////////////////////////////////////

//////////////////to load user landing page. itwont give any any access but can see products
const userLandingPage = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');


    // Fetch products and populate the 'categoryname' field with 'category' model
    const products = await productModel.find().populate('categoryname');
    const categories = await categoryModel.find();
    const banner = await bannerModel.find();

    res.render('users/userLandingPage', { products, categories, banner });
  } catch (error) {
    console.log(error.message);
  }
};






/////////////////user signout
const userSignout = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Clear the user's session and clear the history
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }

      res.setHeader('Cache-Control', 'no-cache, no-store');
      res.redirect('/');
    });
  }
  catch (error) {
    console.log(error.message);
  }
}




//////////////////to dispaly signup page
const userSignup = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.render('users/userSignup', { error: null })
  } catch (error) {
    console.log(error.message)
  }
}




/////////////////////////to signup without otp - for otp not  working situatins
//  const userSignedup = async (req, res) => {   
//     try {
//           const { name, email, phonenumber, password } = req.body;
//           let userData = {
//             name: name,
//             email: email,
//             phonenumber: phonenumber,
//             password: password,
//           };
//           console.log("in controler userSignedup function: user data", userData)
//           userHelper.addUser(userData, (stat) => {
//             console.log(stat);
//             if (stat == "DONE") {
//               console.log("in controler userSignedup function- 'if' block- 2nd time")
//               res.redirect("/signin");
//             } else res.redirect("/signup");
//           });

//     } catch (error) {
//       console.log(error.message);
//     }
//   }




//////////////////////to send otp for the verification to user email
const userSendOtp = async (req, res) => {
  try {
    const phone = "+91" + req.body.phonenumber;
    const email = req.body.email

    const nodemailer = require('nodemailer');

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'aswathysivarajan217@gmail.com',
        pass: 'gfbbcyczzptwlfnc',
      },
    });

    // Generate a random OTP (6-digit number)
    const otp = Math.floor(100000 + Math.random() * 900000);

    const mailOptions = {

      from: 'aswathysivarajan217@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is: ${otp}`,
    };

    //Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }

    });

    emailOtp = otp;
  } catch (error) {
    console.log(error.message);
  }
}




///////////////////to verify otp and make sure that the user got signed up
const userSignedup = async (req, res) => {
  try {
    if (emailOtp !== undefined) {
      const enteredOtp = req.body.otp;
      const storedOtp = emailOtp.toString();
      const name = req.body.name;

      if (enteredOtp === storedOtp) {

        const existingUser = await userModel.findOne({ email: req.body.email });

        if (existingUser) {
          return res.render('users/userSignup', { error: 'Email address is already registered.' });
        }

        const { name, phonenumber, email, password } = req.body;
        let data = {
          name: name,
          phonenumber: phonenumber,
          email: email,
          password: password,
        };

        // Proceed with user registration
        userHelper.addUser(data, (stat) => {
          if (stat == "DONE") {
            res.redirect("/");
          }
          else {
            res.render('users/userSignup', { error: 'User registration failed.' });
          }
        });
      } else {
        return res.render('users/userSignup', { error: "OTP does not match!" });
      }
    }

    else {
      return res.render('users/userSignup', { error: "No OTP data in session. Redirecting to signup with error." });
    }

  } catch (error) {
    console.log(error.message);
  }
}




/////////////////to sign in with some validation
const userSigninPage = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');


  const { email, password } = req.body;
  let data = { email: email, password: password };

  if (!email || !password) {
    return res.render("users/userSignin", {
      error: "Email and Password required",
    });
  }

  try {
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.render("users/userSignin", {
        error: "Invalid Email or Password",
      });
    }
    const status = await bcrypt.compare(data.password, user.password);

    if (!status) {
      return res.render("users/userSignin", {
        error: "Invalid Email or Password",
      });
    }

    if (!user.isActive) {
      return res.render("users/userSignin", { error: "Oops!! Account is blocked! Contact the Administrator!" });
    }

    req.session.user = user;
    res.redirect("/home");
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }

}





//////////////////to  get signin in to the user home page with all access
const userSignin = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    if (req.session.user) res.redirect("/home");
    else
      res.render('users/userSignin', { error: " " })
  } catch (error) {
    console.log(error.message)
  }
}




///////////////////to load user home page
const userHome = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    if (!req.session.user) res.redirect("/");
    else {
      let category = await categoryModel.find().select('offerPercentage').select('categoryname');
      let products = await productModel.find().populate('categoryname');
      let banner = await bannerModel.find();
      res.render('users/userHome', { products: products, banner, category })
    }
  } catch (error) {
    console.log(error.message)
  }
}




////////////////////to show user forgot password page
const userForgotPassword = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.render("users/userForgotPassword", { message: " " });
  } catch (error) {
    console.log(error.message);
  }
};




////////////////////to reset password of an existing user
const userResetPassword = async (req, res) => {
  const resetOtp = emailOtp.toString();
  const otpWritten = req.body.otp;

  let message = {};

  try {
    if (resetOtp === otpWritten) {

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      const { email, password } = req.body;
      const user = await userModel.findOne({ email });
      if (user) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        message.text = "Password Changed successfully";
      } else {
        message.text = "User not found. Can't find user with this email";
      }
    } else {
      message.text = "OTP incorrect. Please try again";
    }
    userSignout(req, res);
  } catch (error) {
    console.error("Error in userResetPassword:", error);
    message.text = "An error occurred. Please try again";
    res.render("users/userForgotPassword", { message });
  }
};






//////////////////////////////////////////////////// USER SIDE PRODUCT DISPLAY ////////////////////////////////////////////

//////////////////////////to display single product details
const userProductDetails = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const productId = req.params.id;
    const category = await categoryModel.find();

    const product = await productModel.findOne({ _id: productId }).populate('categoryname');

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.render("users/userProductDetails", { product, category }); // Pass the sign-in status to your userProductDetails template
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}




///////////////////////////to dispaly product list in the home page and landing page
const userProductLists = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const results = await productModel.aggregate([
      {
        $group: {
          _id: "$categoryname",
          count: { $sum: 1 },
        },
      },
    ]);
    const categoriesWithCounts = await Promise.all(
      results.map(async (result) => {
        const category = await categoryModel.findOne({
          categoryname: result._id,
        });

        return {
          categoryid: result._id,
          count: result.count,
        };
      })
    );

    for (const categoryinfo of categoriesWithCounts) {
      // Find the product with the given ObjectId
      const product = await productModel
        .findOne({ categoryname: categoryinfo.categoryid })
        .populate("categoryname")
        .exec();

      if (product && product.categoryname) {
        const categoryName = product.categoryname.categoryname;
        categoryinfo.catname = categoryName;
      }
    }

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await productModel.countDocuments();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const products = await productModel
      .find()
      .populate("categoryname")
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    if (products)
      res.render("users/userProductLists", {
        products,
        currentPage: page,
        totalPages: totalPages,
        category: categoriesWithCounts,
      });
  } catch (error) {
    console.log(error.message);
  }
};




///////////////////////to show the products based on the category
const userCategory = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const catId = req.params.id;
    const category = await categoryModel.findOne({ _id: catId })
    const categoryname = category.categoryname
    const products = await productModel.find({ categoryname: catId }).populate("categoryname")

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = 9;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const prods = await productModel
      .find()
      .populate("categoryname")
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    if (prods)
      res.render("users/userCategory", {
        products,
        currentPage: page,
        totalPages: totalPages,
        catId,
        categoryname
      });

  } catch (error) {
    console.log(error.message);
  }
};




///////////////////////////to dispaly the products based on the price
const userSortPrice = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const results = await productModel.aggregate([
      {
        $group: {
          _id: "$categoryname", // Group by category name
          count: { $sum: 1 }, // Count the number of products in each group
        },
      },
    ]);

    const categoriesWithCounts = await Promise.all(
      results.map(async (result) => {
        const category = await categoryModel.findOne({
          categoryname: result._id,
        });

        return {
          categoryid: result._id,
          count: result.count,
        };
      })
    );

    for (const categoryinfo of categoriesWithCounts) {
      // Find the product with the given ObjectId
      const product = await productModel
        .findOne({ categoryname: categoryinfo.categoryid })
        .populate("categoryname")
        .exec();

      if (product && product.categoryname) {
        const categoryName = product.categoryname.categoryname;
        categoryinfo.catname = categoryName;
      }
    }
    const { sortOption } = req.query;
    let sortCriteria = {};
    if (sortOption === '2') {
      sortCriteria = { price: 1 };      // Sort by Price: Low to High
    } else if (sortOption === '3') {
      sortCriteria = { price: -1 };    // Sort by Price: High to Low
    }


    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await productModel.countDocuments();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const sortedProducts = await productModel.find().populate('categoryname').sort(sortCriteria).skip(skipItems).limit(ITEMS_PER_PAGE);

    if (sortedProducts)
      res.render("users/userSortPrice", {
        products: sortedProducts,
        currentPage: page,
        totalPages: totalPages,
        category: categoriesWithCounts,
        sortOption,

        calculateMRP: (product) => {

          if (product.categoryname.offerPercentage > 0) {
            return product.price;
          } else if (product.categoryname.offerPercentage === 0 && product.productOffer > 0) {
            return product.productOffer;

          } else {
            return product.mrp;
          }
        },
      });

  } catch (error) {
    console.log(error.message);
  }
}





//////////////////////to seach the products
const userSearch = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const query = req.query.query;
    const regex = new RegExp(query, "i");
    const searchResults = await productModel.find({
      $or: [
        { productname: regex },
      ],
    });

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = searchResults.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    res.render("users/userSearch", {
      results: searchResults,
      query: query,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




////////////////////to display user wishlist 
const userWishlist = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const user1 = req.session.user
    const userId = req.session.user._id;

    let wishlist = await wishlistModel.findOne({ user: userId });

    if (wishlist == null) {
      wishlist = await wishlistModel.create({ user: userId });    //if no cart, create cart for the user
    }

    wishlist = await wishlistModel
      .findOne({ user: userId })
      .populate({ path: "products.product" });
    res.render("users/userWishlist", { wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




//////////////////////add product to the wishlist
const addToWishlist = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const userId = req.session.user._id;
    const { productId } = req.body;

    let wishlist = await wishlistModel.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new wishlistModel({ user: userId, products: [] });
    }

    const productIndex = wishlist.products.findIndex(product => product.product.toString() === productId);

    if (productIndex === -1) {
      wishlist.products.push({ product: productId }); // Ensure 'product' is set

      await wishlist.save();
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }
  } catch (error) {
    console.error(error.message);
    // Log the validation errors if any
    if (error.errors) {
      Object.keys(error.errors).forEach((field) => {
      });
    }
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};



////////////////////remove product from the wishlist
const removeFromWishlist = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const { wishlistId, productId } = req.params;
    // Find the cartlist document by ID
    const wishlist = await wishlistModel.findById(wishlistId);

    if (!wishlist) {
      return res.status(404).json({ error: "wishlist not found" });
    }

    // Find the index of the product in the "products" array
    const productIndex = wishlist.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    // Remove the product from the "products" array
    wishlist.products.splice(productIndex, 1);

    // Save the updated cartlist document
    const updatedWishlist = await wishlist.save();
    res.redirect("/wishlist");
  } catch (error) {
    console.error("Error deleting product from wishlist:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}






///////////////////////////////////////////////////////////// USER PROFILE ///////////////////////////////////////////////////

//////////////////to display user profile
const userProfile = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const category = await categoryModel.find();
    const userId = req.session.user._id;
    const user = await userModel.findById(userId);
    const cart = await cartModel.findOne({ user: userId });

    // Calculate the size of the 'products' array
    const cartProductsVolume = cart.products.length;

    res.render("users/userProfile", { user, category, cartVolume: cartProductsVolume });
  } catch (error) {
    console.log(error.message);
  }
};




////////////////////to update user profile details
const userProfileUpdated = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const userId = req.session.user._id;
    const name = req.body.name;
    const phonenumber = req.body.phonenumber;
    const user = await userModel.findByIdAndUpdate(
      userId,
      { name, phonenumber },
      { new: true }
    );

    const cart = await cartModel.findOne({ user: userId });

    // Calculate the size of the 'products' array
    const cartProductsVolume = cart.products.length;

    // Set a flag to indicate the update was successful
    const isUpdated = true;

    // Pass the flag and the updated user data to the template
    res.render("users/userProfile", { user, isUpdated, cartVolume: cartProductsVolume });
  } catch (error) {
    console.log(error.message);
  }
};





////////////////////////to display add address page
const userAddress = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const category = await categoryModel.find();
    const userId = req.session.user._id;
    const user = await userModel.findById(userId);
    res.render("users/userAddAddress", { user, category });
  } catch (error) {
    console.log(error.message);
  }
};





//////////////////////to add new address
const userAddAddress = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const userId = req.session.user._id;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode;

    const cart = await cartModel.findOne({ user: userId });

    // Calculate the size of the 'products' array
    const cartProductsVolume = cart.products.length;

    if (address && city && state && pincode) {
      // Add address only if all fields are provided
      const user = await userModel.findByIdAndUpdate(
        userId,
        {
          $push: {
            address: {
              address: address,
              city: city,
              state: state,
              pincode: pincode,
            },
          },
        },
        { new: true }
      );

      res.render("users/userProfile", { user, cartVolume: cartProductsVolume });
    } else {
      // Handle validation errors here
      res.redirect("/userprofile");
    }
  } catch (error) {
    console.log(error.message);
  }
};





/////////////////////////to displat edit existing address  page
const userEditAddress = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');


    const userId = req.session.user._id;
    const user = await userModel.findById(userId);

    // Retrieve the addressId from route parameters
    const addressId = req.params.addressId;

    // Find the specific address in the user's address array by matching _id
    const addressData = user.address.find((address) => address._id.toString() === addressId);

    if (!addressData) {
      // Handle the case where the address is not found
      return res.status(404).send("Address not found");
    }

    res.render("users/userEditAddress", {
      user,
      addressId,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      pincode: addressData.pincode,
    });
  } catch (error) {
    console.log(error.message);
  }
};





///////////////////////to update existing address
const userUpdatedAddress = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');


    const userId = req.session.user._id;
    const addressId = req.query.addressId;

    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode;

    const user = await userModel.findOneAndUpdate(
      { _id: userId, "address._id": addressId }, // Match the user and address ID
      {
        $set: {
          "address.$.address": address,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.pincode": pincode,
        },
      },
      { new: true }
    );

    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};





//////////////////////to delete address
const removeAddress = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');


    const userId = req.session.user._id; // Assuming you have user information in the session
    const addressIdToRemove = req.query.addressId; // Pass the address ID you want to remove in the query

    // Find the user by their ID
    const user = await userModel.findById(userId);

    if (!user) {
      // Handle the case where the user is not found
      return res.status(404).send('User not found');
    }

    // Filter out the address with the specified ID
    user.address = user.address.filter((address) => address._id.toString() !== addressIdToRemove);

    // Save the updated user document
    await user.save();

    // Redirect or respond accordingly
    res.redirect('/userprofile'); // Redirect back to the user profile page, for example
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};




///////////////////to add new address in the checkout page
const addNewAddress = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');


    const userId = req.session.user._id;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode;
    const user = await userModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          address: {
            address: address,
            city: city,
            state: state,
            pincode: pincode,
          },
        },
      },
      { new: true }
    );
    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
  }
};


/////////////////////////////////////////////////////////// USER SIDE COUPON ////////////////////////////////////////////////////////

///////////////////////user side  add coupon button in checkout
const userAddCoupon = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const totalAmountInCheckout = req.query.total;
    const currentDate = new Date();
    const category = await categoryModel.find();
    const coupons = await couponModel.find({
      minimumAmount: { $lt: totalAmountInCheckout },
      expirationDate: { $gt: currentDate },
    });
    res.render("users/userCoupons", { coupons, category });
  } catch (error) {
    console.log(error.message);
  }
};



//////////////////adding coupon to the checkout
const userAddCouponpost = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const shouldRedirect = true;
  if (shouldRedirect) {
    res.json({ redirect: true });
  } else {
    res.json({ redirect: false });
  }
};





///////////////////////////////////////////////////////// WALLET /////////////////////////////////////////////////////////////////

///////////////////to display user wallet details
const userWallet = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Check if the user is authenticated
    if (!req.session.user) {
      return res.redirect('/home'); // Redirect to the login page or handle it as per your authentication flow
    }

    // Fetch the user by ID
    const userId = req.session.user._id; // Assuming you have a user session
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send('User not found'); // Handle this case appropriately
    }

    // Fetch the user's transactions
    const userTransactions = user.wallet.transactions;

    res.render('users/userWallet', { user, userTransactions });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error'); // Handle this error appropriately
  }
};




/////////////////////////////////////////////// REFERRAL OFFER /////////////////////////////////////////////////

////////////////////////to show the user invite friend page
const userRefer = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.render('users/userReferal')
  } catch (error) {
    console.log(error.message)
  }
}


///////////////////////to send the email to the friend
const sendEmail = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const friendEmail = req.body.friendEmail;
  const websiteLink = 'http://localhost:3000/';

  // Fetch coupon data
  const currentDate = new Date();
  const coupons = await couponModel.find();
  const referralCoupons = coupons.filter((coupon) => coupon.isReferral === true);


  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'aswathysivarajan217@gmail.com',
      pass: 'gfbbcyczzptwlfnc',
    },
  });

  // Email content
  const mailOptions = {
    from: 'aswathysivarajan217@gmail.com',
    to: friendEmail,
    subject: 'Check Out This Website',
    html: `
      <p style="color: red;">I wanted to share an interesting website with you: <a href="${websiteLink}">Click here</a></p>
      <img src="cid:image1" alt="Image">
    `,
    attachments: [
      {
        filename: 'refer.jpg',
        path: './public/img/refer.jpg',
        cid: 'image1',
      },
    ],
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.send('Error sending email');
    } else {
      res.render('users/userInviteSuccess', { coupons: referralCoupons });
    }
  });
};




module.exports = {
  userLandingPage,
  userSignin,
  userSignout,
  userSignup,
  userSendOtp,
  userSignedup,
  userSigninPage,
  userHome,
  userForgotPassword,
  userResetPassword,
  userProductDetails,
  userProductLists,
  userCategory,
  userSortPrice,
  userSearch,
  userWishlist,
  addToWishlist,
  removeFromWishlist,
  userProfile,
  userProfileUpdated,
  userAddress,
  userAddAddress,
  addNewAddress,
  userEditAddress,
  userUpdatedAddress,
  removeAddress,
  userAddCoupon,
  userAddCouponpost,
  userWallet,
  userRefer,
  sendEmail
}