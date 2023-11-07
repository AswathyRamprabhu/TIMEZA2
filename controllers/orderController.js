const userRoute = require('../routes/userRoutes')
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const orderModel = require('../models/orderModel')
const path = require('path');
const razorpay = require('../helpers/razorPay')
const crypto = require("crypto");
const { configDotenv } = require('dotenv')
const PDFDocument = require('pdfkit');
const fs = require('fs');




///////////////////////////////////////////////////////// ORDER CONFIRMATION AND CANCELLATION ///////////////////////////////////////////

////////////////to dispaly order confirmation page and implement wallet debit opersation
const userOrderConfirmation = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const category = await categoryModel.find();
    const orderId = req.params.id;
    const userId = req.session.user._id;
    const user = await userModel.findById(userId);
    const order = await orderModel.findById(orderId).populate("items.productId user").populate("coupon");


    res.render("users/userOrderConfirmation", { order, user, category, orderStatus: order.orderStatus, coupon: order.coupon, });
  } catch (error) {
    console.log(error.message);
  }
}






/////////////////to list orders done by user
const orders = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const skip = (page - 1) * perPage;

    const orders = await orderModel
      .find({ user: userId })
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    const totalOrders = await orderModel.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / perPage);

    const address = await orderModel
      .findOne({ user: userId }, "address")
      .populate("address")
      .exec();

    const orderStatus = await orderModel
      .findOne({ user: userId }, "orderStatus")
      .exec();

    const category = await categoryModel.find();
    const user = await userModel.findById(userId);

    res.render("users/userOrderLists", {
      orders,
      user,
      category,
      address,
      orderStatus,
      page,
      totalPages,
      perPage,
    });
  } catch (error) {
    console.log(error.message);
  }
};









/////////////////to dispaly single order details as invoice
const userOrderDetails = async (req, res) => {
  try {
    // Extract the order ID from the query parameter
    const orderId = req.query._id;
    const userId = req.session.user._id;

    // Fetch the details of the order based on the order ID
    const order = await orderModel.findById(orderId).populate("items.productId user").populate("coupon");
    const user = await userModel.findById(userId);

    // Filter out items with a productOrderStatus of "cancelled"
    order.items = order.items.filter(item => item.productOrderStatus !== "cancelled");

    // Render the "single order details" page and pass the filtered order data to it
    res.render('users/userOrderDetails', { order, user, coupon: order.coupon });
  } catch (error) {
    console.error(error);
    // Handle errors
    res.status(500).send('Error fetching order details.');
  }
};



///////////////////////to cancel the order done by user by user itself and do wallet credit operation
const editOrderDetails = async (req, res) => {
  let user;
  try {
    const orderId = req.params.id;
    const action = req.query.action;

    if (action === 'cancel') {
      const canceledOrder = await orderModel.findById(orderId);

      if (canceledOrder.paymentMode !== 'cashondelivery') {
        const user = await userModel.findById(canceledOrder.user);

        if (user) {
          user.wallet.balance += canceledOrder.finalPrice;

          const transaction = {
            ID: canceledOrder.humanReadableID,
            createdAt: canceledOrder.createdAt,
            type: "Credit",
            amount: canceledOrder.finalPrice,
          };

          user.wallet.transactions.push(transaction);
          await user.save();
        } else {
          console.log("User not found for this order.");
        }
      }

      if (canceledOrder.orderStatus !== 'Cancelled') {
        await orderModel.findByIdAndUpdate(orderId, { orderStatus: "Cancelled" });

        for (const orderItem of canceledOrder.items) {
          const productId = orderItem.productId;
          const quantityOrdered = orderItem.quantity;

          await productModel.findByIdAndUpdate(productId, {
            $inc: { stock: quantityOrdered }
          });

          orderItem.productOrderStatus = "Cancelled";
        }

        await canceledOrder.save();

        if (user) {
          const userTransactions = user.wallet.transactions;
          res.render('users/userWallet', { user, userTransactions });
        } else {
          res.redirect("/home");
        }
      } else {
        res.redirect("/home");
      }
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};






////////////////////to cancel single product from order
const cancelProduct = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.query.productId;

    const order = await orderModel
      .findById(orderId)
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const productToCancel = order.items.find(item => item.productId._id.toString() === productId);

    if (productToCancel) {
      if (order.paymentMode !== 'cashondelivery') {
        const user = await userModel.findById(order.user);

        if (user) {
          const refundAmount = productToCancel.price * productToCancel.quantity;
          user.wallet.balance += refundAmount;

          const transaction = {
            ID: order.humanReadableID,
            createdAt: new Date(),
            type: "Credit",
            amount: refundAmount,
          };

          user.wallet.transactions.push(transaction);
          await user.save();
        }
      }

      productToCancel.productOrderStatus = "Cancelled";

      const allProductsCancelled = order.items.every(item => item.productOrderStatus === "Cancelled");

      if (allProductsCancelled) {
        order.orderStatus = "Cancelled";
      }

      await productModel.findByIdAndUpdate(productId, {
        $inc: { stock: productToCancel.quantity }
      });

      await order.save();
      console.log("order details after product cancelled", order);

      res.redirect(`/orders`);
    } else {
      res.status(404).json({ error: "Product not found in the order" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





/////////////////////////to generate and download invoice of single order
const generateAndDownloadInvoice = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.session.user._id;

  try {
    const order = await orderModel
      .findOne({ _id: orderId, user: userId })
      .populate("items.productId user");

    const user = await userModel.findById(userId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const doc = new PDFDocument();
    const filePath = `public/invoices/invoice_${orderId}.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.font('Helvetica-Bold').fontSize(18);
    const imagePath = path.resolve(__dirname, '../public/img/logo.png');
    doc.image(imagePath, 400, 50, { width: 150 });

    doc.fontSize(24).font('Helvetica-Bold').text('Invoice', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).text(`Order ID: ${order.humanReadableID}`, 50, doc.y + 20);

    doc.font('Helvetica');
    doc.text(`Customer: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phonenumber}`);

    const rightSideY = doc.y;
    const productDetailsBoxY = rightSideY + 150;
    doc.rect(50, productDetailsBoxY, 500, 200).stroke();

    doc.font('Helvetica-Bold');
    doc.text('Product', 60, productDetailsBoxY + 10);
    doc.text('Unit Price', 260, productDetailsBoxY + 10);
    doc.text('Quantity', 360, productDetailsBoxY + 10);
    doc.text('Total', 460, productDetailsBoxY + 10);

    let rowY = productDetailsBoxY + 30;

    order.items.forEach((item) => {
      if (item.productOrderStatus !== 'Cancelled') {
        doc.font('Helvetica');
        const productX = 60;
        const priceX = 260;
        const quantityX = 360;
        const totalX = 460;

        doc.text(item.productId.productname, productX, rowY);
        doc.text(`INR ${item.price}.00`, priceX, rowY);
        doc.text(item.quantity.toString(), quantityX, rowY);
        doc.text(`INR ${item.price * item.quantity}.00`, totalX, rowY);

        rowY += 20;
      }
    });

    doc.font('Helvetica-Bold').fontSize(16);
    doc.text(`Subtotal: INR ${order.totalAmount}.00`, 60, productDetailsBoxY + 220);
    doc.fontSize(16);
    doc.text(`Discount: INR ${order.discountAmount}.00`, 60, productDetailsBoxY + 220);
    doc.moveDown(1);
    doc.fontSize(20);
    doc.text(`Grand total: INR ${order.finalPrice}.00`, 60, productDetailsBoxY + 260);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(13);
    doc.text('Payment Info:', 400, rightSideY);
    doc.fontSize(10);
    doc.text(`Done (${order.paymentMode})`, 400, rightSideY + 20);

    doc.font('Helvetica-Bold').fontSize(13);
    doc.text('Delivery Address:', 400, rightSideY + 40);
    doc.fontSize(10);
    doc.text(`Address: ${order.address.address}`);
    doc.text(`City: ${order.address.city}`);
    doc.text(`State: ${order.address.state}`);
    doc.text(`Pin-Code: ${order.address.pincode}`);
    doc.moveDown(1);

    doc.rect(20, 20, 570, 800).stroke();

    doc.end();

    writeStream.on('finish', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.download(filePath, `invoice_${orderId}.pdf`);
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};





///////////////////////////////////////////////////// USER PAYMENT THROUGH RAZORPAY /////////////////////////////////////////////

const userPayment = async (req, res) => {
  try {
    const category = await categoryModel.find();
    const { oid: orderId } = req.query;
    const order = await orderModel.findById(orderId);
    if (order.orderStatus === "pending") {
      res.render("users/userPayment", {
        category,
        order,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
      });
    }
  } catch (error) {
    console.log(error.message)
  }
}




const checkPayment = async (req, res) => {
  const userId = req.session.user._id;
  const { razorpayOrderId, razorpayPaymentId, secret } = req.body;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
  let generatedSignature = hmac.digest("hex");
  if (generatedSignature == secret) {
    await orderModel.findOneAndUpdate(
      { "paymentData.id": razorpayOrderId },
      {
        orderStatus: "placed",
        $set: { "items.$[].productOrderStatus": "placed" }
      }
    );

    // Clear the user's cart
    await cartModel.findOneAndUpdate({ user: userId }, { products: [] });

    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
};






module.exports = {
  userOrderConfirmation,
  editOrderDetails,
  cancelProduct,
  orders,
  userOrderDetails,
  generateAndDownloadInvoice,
  userPayment,
  checkPayment,
}