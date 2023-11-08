const userRoute = require('../routes/userRoutes')
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const orderModel = require('../models/orderModel')
const couponModel = require('../models/couponModel')
const razorpay = require('../helpers/razorPay')
const { configDotenv } = require('dotenv')
const Swal = require('sweetalert2')




/////////////////////////////////////////////////////// CART MANAGEMENT ////////////////////////////////////////////////////////

///////////////to display and create user cart
const userCart = async (req, res) => {
  try {
    const user1 = req.session.user;
    const userId = req.session.user._id;
    const message = "Exciting items are patiently waiting in your cart for your final touch.";
    let cart = await cartModel.findOne({ user: userId });

    if (cart == null) {
      cart = await cartModel.create({ user: userId });    //if no cart, create cart for the user
    }
    cart = await cartModel
      .findOne({ user: userId })
      .populate({
        path: "products.product",
        populate: {
          path: "categoryname",
        },
      });

    res.render('users/userCart', { message, cart })
  } catch (error) {
    console.error(error.message);
  }
}





///////////to add products in to the cart
const addToCart = async (req, res) => {
  const user1 = req.session.user;
  const userId = req.session.user._id;
  const { productId, quantity } = req.body;

  try {
    let cart = await cartModel.findOne({ user: userId });
    if (cart == null) {
      cart = await cartModel.create({ user: userId }); //if no cart, create cart for the user
    }

    if (cart.products.length === 0) {
      cart.products.push({ product: productId, quantity }); //if cart empty, adding the prdts, sent via the req
      res.status(200).json({ success: true });
    } else {
      let i;
      for (i = 0; i < cart.products.length; i++) {
        //if same prdt- update its quantity
        if (cart.products[i].product == productId) {
          if (cart.products[i].quantity + Number(quantity) > 2) {
            return res.status(200).json({ success: false, message: "Max quantity is 2" });
          }
          cart.products[i].quantity += Number(quantity);
          res.status(200).json({ success: true });
          break;
        }
      }

      if (i === cart.products.length) {

        cart.products.push({ product: productId, quantity });
        res.status(200).json({ success: true });
      }
    }
    cart.save();
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};




////////////////to remove products from cart
const removeFromCart = async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const cart = await cartModel.findById(cartId);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found in the cart" });
    }

    cart.products.splice(productIndex, 1);
    const updatedCart = await cart.save();
    res.redirect("/cart");
  } catch (error) {
    console.error("Error deleting product from cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}





////////////////to update and limit the quantity of the products in the cart
const updateCart = async (req, res) => {
  const userId = req.session.user._id;
  const { productId, quantity } = req.body;
  try {
    let cart = await cartModel.findOne({ user: userId });

    if (cart.products.length === 0) {
      cart.products.push({ product: productId, quantity });
      res.status(200).json({ success: true });
    } else {
      let i;
      for (i = 0; i < cart.products.length; i++) {
        if (cart.products[i].product == productId) {
          cart.products[i].quantity = Number(quantity);
          res.status(200).json({ success: true });
          break;
        }
      }

      if (i === cart.products.length) {
        cart.products.push({ product: productId, quantity });
        res.status(200).json({ success: true });
      }
    }
    cart.save();
  } catch (error) {
    console.log(error.message);
  }
}






/////////////////////////////////////////////////////// CHECKOUT - USER SIDE ORDER MANAGEMENT  ////////////////////////////////////////////////////////

///////////////////to display checkout page
const userCheckOut = async (req, res) => {
  try {
    const category = await categoryModel.find();
    const userId = req.session.user._id;
    const cart = await cartModel
      .findOne({ user: userId })
      .populate({ path: "products.product" });
    const user = await userModel.findById(userId);
    const coupon = req.query.couponCode || '';
    const discountAmount = req.query.discountAmount || 0;
    const couponId = req.query.couponId || '';

    // Check if any product in the cart is out of stock
    let canProceed = true;
    for (const cartItem of cart.products) {
      const stock = cartItem.product.stock;
      if (cartItem.quantity > stock) {
        canProceed = false;
        break;
      }
    }

    if (canProceed) {
      res.render("users/userCheckout", { user, cart, category, coupon, discountAmount, couponId });
    } else {
      res.render("users/userCart", { message: "Some products in your cart are out of stock. Please remove them before proceeding.", cart });
    }
  } catch (error) {
    console.log(error.message);
  }
}





//////////////////to update the datas related to products and chose the payment ro place the order make payment
const userCheckOutPost = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { address, couponId, paymentType } = req.body;
    const validatedCouponId = couponId === "" ? null : couponId;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cart = await cartModel.findOne({ user: userId })
      .populate({
        path: "products.product",
        select: "price stock",
      })
      .select("-price");

    let updateOperations = [];
    let isAvailable = true;

    for (const item of cart.products) {
      if (item.quantity > item.product.stock) {
        isAvailable = false;
        break;
      }

      updateOperations.push({
        updateOne: {
          filter: { _id: item.product._id.toString() },
          update: { $inc: { stock: -item.quantity } },
        },
      });
    }

    if (!isAvailable) {
      return res.status(404).json({ success: false, message: "Some items are out of stock" });
    }

    const result = await productModel.bulkWrite(updateOperations);

    if (result.modifiedCount !== cart.products.length) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, Pls try again later",
      });
    }

    const orderItems = [];

    cart.products.forEach((item) => {
      const tmp = {
        productId: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        productOrderStatus: item.product.productOrderStatus,
      };
      orderItems.push(tmp);
    });

    let addressdetail;
    user.address.forEach((item) => {
      if (item._id.toString() === address) addressdetail = item;
    });

    let discountAmount = 0;

    if (couponId) {
      discountAmount = await couponModel.findById(couponId);
      discountAmount = discountAmount ? discountAmount.discountAmount : 0;
    }

    let subtotal = 0;
    cart.products.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    let grandTotal = subtotal - discountAmount;
    let cancelledPrice = 0;

    const orderData = {
      user: userId,
      items: orderItems,
      address: addressdetail,
      coupon: validatedCouponId,
      discountAmount: discountAmount,
      paymentMode: paymentType,
      finalPrice: grandTotal,
      totalAmount: subtotal,
      cancelledPrice: cancelledPrice,
    };

    const order = await orderModel.create(orderData);

    if (paymentType === "cashondelivery") {
      await order.save();
      await cartModel.findOneAndUpdate({ user: userId }, { products: [] });
      return res.status(200).json({ success: true, url: `/orderdetails/${order._id}` });
    } else if (paymentType === "onlinepayment") {
      const razorpay_order = await razorpay.orders.create({
        amount: order.finalPrice * 100,
        currency: "INR",
        receipt: order._id.toString(),
      });

      order.paymentData = razorpay_order;
      await order.save();
      return res.status(200).json({ success: true, url: `/orders/payment?oid=${order._id}` });
    } else if (paymentType === "walletpayment") {
      if (user.wallet.balance >= order.finalPrice) {
        user.wallet.balance -= order.finalPrice;

        const transaction = {
          ID: order.humanReadableID,
          createdAt: order.createdAt,
          type: "Debit",
          amount: order.finalPrice,
        };

        user.wallet.transactions.push(transaction);
        userTransactions = user.wallet.transactions;
        await user.save();

        order.isPaid = true;
        order.orderStatus = "placed";

        for (const orderItem of order.items) {
          orderItem.productOrderStatus = "placed";
        }

        await order.save();
        await cartModel.findOneAndUpdate({ user: userId }, { products: [] });

        return res.status(200).json({ success: true, url: `/orderdetails/${order._id}` });
      } else {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }
    } else {
      return res.status(500).json({ success: false, message: "Pls select a payment option" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};






module.exports = {
  userCart,
  addToCart,
  removeFromCart,
  updateCart,
  userCheckOut,
  userCheckOutPost,
}
