const adminRoute = require('../routes/adminRoutes');
const userHelper = require('../helpers/userHelper');
const categoryHelper = require('../helpers/categoryHelper');
const bcrypt = require('bcrypt');
const { configDotenv } = require('dotenv');
const userModel = require("../models/userModel");
const orderModel = require('../models/orderModel');
const productModel = require("../models/productModel");
const bannerModel = require('../models/bannerModel');
const moment = require('moment');
const excel = require("exceljs");
const puppeteer = require("puppeteer");
const sharp = require('sharp');
const { cropBannerImage } = require("../multer/bannerCrop")
const fs = require('fs');



////////////////////////////////////////////////////////// ADMIN LOGIN \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

///////////////////to dispaly admin login page
const adminLogin = async (req, res) => {
  try {
    res.render('admin/adminLogin');
  } catch (error) {
    console.error(error.message);
  }
};




//////////////////logout from admin access
const adminLogout = async (req, res) => {
  try {
    req.session.admin = false;
    res.redirect('/admin/login');
  } catch (error) {
    console.error(error.message);
  }
};




/////////////////////to login to get admin access
const verifyAdmin = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const { email, password } = req.body;
    const admin = await userHelper.getUser({ email, password });

    if (!admin) {
      res.render('admin/adminLogin', { error: 'Please enter the Valid Credentials' });
    } else {
      req.session.admin = true;
      req.session.admin1 = admin;
      res.redirect('/admin/adminhome');
    }
  }
  catch (error) {
    console.error(error.message);
  }
}



////////////////////////////to disaplay admin home and it shows the grapgical representation of sales
const adminHome = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    if (!req.session.admin) {
      // If the user is not authenticated as an admin, redirect them to the admin login page
      return res.redirect('/admin/login');
    }

    const orders = await orderModel.aggregate([
      { $match: { orderStatus: 'Delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = orders.map(({ _id, total, count }) => ({ date: _id, amount: total, count }));
    res.render('admin/adminHome', { data });
  } catch (error) {
    console.error(error.message); // Use console.error for error messages
  }
};





////////////////////////////////////////// USER LIST //////////////////////////////////////////////////////////

////////to display the Users List page
const adminUsersList = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const user = await userModel.find();
    if (user) res.render("admin/adminUsersList", { data: user });
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
}




//////////////////////to block users from admin side to deny their access 
const adminBlockUnblock = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const user = await userModel.findById(req.body.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isActive) {
      user.isActive = false;
    }
    else {
      user.isActive = true;
    }
    await user.save();
    res.json({ status: true, message: "User blocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}




////////////////////////////////////////// ORDER LIST //////////////////////////////////////////////////////////

//////////////////////to display admin side order list
const adminOrderList = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 15;

    const totalOrders = await orderModel.countDocuments({});
    const totalPages = Math.ceil(totalOrders / perPage);

    const orders = await orderModel
      .find({})
      .populate('user')
      .populate('coupon')
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render("admin/adminOrderLists", {
      order: orders,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error(error.message);
  }
}






////////////////////to display  admin side side order list editing page
const adminEditOrderListPage = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const orderId = req.query._id;
    const order = await orderModel.findById({ _id: orderId }).populate('user items.productId').populate("coupon")
    res.render("admin/adminOrderDetail", { order, coupon: order.coupon });
  } catch (error) {
    console.error(error.message);
  }
}



///////////////////////to edit orders from admin side
const adminEditOrderList = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const orderId = req.body.id;
    const orderStatus = req.body.status;
    const updatedOrder = await orderModel.findById(orderId);

    if (orderStatus === 'Cancelled') {
      // Iterate through the order items to restock each product
      for (const orderItem of updatedOrder.items) {
        const productId = orderItem.productId;
        const quantityOrdered = orderItem.quantity;

        // Find and update the product's stock
        await productModel.findByIdAndUpdate(productId, {
          $inc: { stock: quantityOrdered } // Increment stock by the quantity ordered
        });
      }
    }

    // Update the order status
    await orderModel.findByIdAndUpdate(orderId, { orderStatus: orderStatus });

    res.redirect("/admin/adminorderlists");
  } catch (error) {
    console.error(error.message);
  }
}





///////////////////to update product order status when order got cancelled
const updateProductStatus = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const orderId = req.body.orderId;
    const productId = req.body.productId;
    const status = req.body.status;

    const order = await orderModel.findById(orderId);

    const product = order.items.find((item) => item.productId.toString() === productId);

    if (product) {
      product.productOrderStatus = status;

      await order.save();

      res.redirect('/admin/adminorderlists');
    } else {
      return res.status(404).json({ message: 'Product not found in the order' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};





////////////////////////////////////////// SALES REPORT //////////////////////////////////////////////////////////

////////////////////to show sales report in admin side
const adminSalesReport = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    let { from, to } = req.query;

    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const last7days = moment().subtract(7, 'days').format('YYYY-MM-DD');
    const last30days = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const lastYear = moment().subtract(1, 'years').format('YYYY-MM-DD');

    if (!from || !to) {
      from = last30days;
      to = today;
    }

    if (from > to) {
      [from, to] = [to, from];
    }

    to += 'T23:59:59.999Z';

    const orders = await orderModel
      .find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'Delivered' })
      .populate('user')
      .populate('coupon');

    from = from.split('T')[0];
    to = to.split('T')[0];

    const netTotalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const netFinalAmount = orders.reduce((acc, order) => acc + order.finalAmount, 0);
    const netDiscount = orders.reduce((acc, order) => acc + order.discount, 0);

    const dateRanges = [
      { text: 'Today', from: today, to: today },
      { text: 'Yesterday', from: yesterday, to: yesterday },
      { text: 'Last 7 days', from: last7days, to: today },
      { text: 'Last 30 days', from: last30days, to: today },
      { text: 'Last year', from: lastYear, to: today },
    ];

    // Pagination
    const ITEMS_PER_PAGE = 15;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = orders.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Render the admin sales report view
    res.render('admin/adminSalesReport', {
      orders,
      from,
      to,
      dateRanges,
      netTotalAmount,
      netFinalAmount,
      netDiscount,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};





//////////////////to download sales reports in excel form and pdf form
const adminDownloadReports = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    console.log("Hi")
    const { type } = req.params
    let { from, to } = req.query
    to += 'T23:59:59.999Z'
    const orders = await orderModel.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'Delivered' }).populate(
      'user'
    )
    const netTotalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0)
    const netFinalAmount = orders.reduce((acc, order) => acc + order.finalPrice, 0)
    const netDiscount = orders.reduce((acc, order) => acc + order.discountAmount, 0)

    if (type === 'excel') {
      const workbook = new excel.Workbook()
      const worksheet = workbook.addWorksheet('Report')

      worksheet.columns = [
        { header: 'SL. No', key: 's_no', width: 10 },
        { header: 'Order ID', key: 'oid', width: 20 },
        { header: 'Date', key: 'createdAt', width: 20 },
        { header: 'User ID', key: 'userID', width: 20 },
        { header: 'Total Price', key: 'totalAmount', width: 20 },
        { header: 'Discount', key: 'discountAmount', width: 20 },
        { header: 'Final Price', key: 'finalPrice', width: 20 },
        { header: 'Payment Mode', key: 'paymentMode', width: 20 },
      ]

      worksheet.duplicateRow(1, 8, true)
      worksheet.getRow(1).values = ['Sales Report']
      worksheet.getRow(1).font = { bold: true, size: 16 }
      worksheet.getRow(1).alignment = { horizontal: 'center' }
      worksheet.mergeCells('A1:H1')

      worksheet.getRow(2).values = []
      worksheet.getRow(3).values = ['', 'From', from]
      worksheet.getRow(3).font = { bold: false }
      worksheet.getRow(3).alignment = { horizontal: 'right' }
      worksheet.getRow(4).values = ['', 'To', to.split('T')[0]]
      worksheet.getRow(5).values = ['', 'Total Orders', orders.length]
      worksheet.getRow(6).values = ['', 'Net Final Price', netFinalAmount]

      worksheet.getRow(7).values = []
      worksheet.getRow(8).values = []

      let count = 1
      orders.forEach((order) => {
        order.s_no = count
        order.oid = order.humanReadableID.toString().replace(/"/g, '')
        order.userID = order.user.email
        worksheet.addRow(order)
        count += 1
      })

      worksheet.getRow(9).eachCell((cell) => {
        cell.font = { bold: true }
      })

      worksheet.addRow([])
      worksheet.addRow([])

      worksheet.addRow(['', '', '', '', '', '', 'Net Total Price', netTotalAmount, ''])
      worksheet.addRow(['', '', '', '', '', '', 'Net Discount Price', netDiscount, ''])
      worksheet.addRow(['', '', '', '', '', '', 'Net Final Price', netFinalAmount, ''])
      worksheet.lastRow.eachCell((cell) => {
        cell.font = { bold: true }
      })

      await workbook.xlsx.writeFile('sales_report.xlsx')
      const file = `${__dirname}/../sales_report.xlsx`
      res.download(file)
    } else {
      const browser = await puppeteer.launch()
      const page = await browser.newPage()

      // Set content and styles for the PDF
      const content = `
                <!DOCTYPE html>
                <html lang="en">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                    <style>
                        .text-center {
                            text-align: center;
                        }

                        .text-end {
                            text-align: end;
                        }

                        .table-container {

                            width: 80%;
                            margin: 0 auto;
                            margin-top: 1.5rem;
                            border-radius: 5px;
                        }

                        table {
                            caption-side: bottom;
                            border-collapse: collapse;
                            margin-bottom: 1rem;
                            vertical-align: top;
                            border-color: #dee2e6;
                            border: 1px solid #ccc;
                            border-bottom: 1px solid #444;
                            width: 80%;
                            margin: 0 auto;
                            margin-top: 1.5rem;
                            border-radius: 10px;
                        }

                        thead {
                            border-color: inherit;
                            border-style: solid;
                            border-width: 0;
                            vertical-align: bottom;
                        }

                        tr {
                            font-size: 12px;
                            border-color: inherit;
                            border-style: solid;
                            border-width: 0;
                        }

                        td {
                            border-color: inherit;
                            border-style: solid;
                            border-width: 0;
                            padding: .5rem .5rem;
                            background-color: transparent;
                            border-bottom-width: 1px;
                            box-shadow: inset 0 0 0 9999px #fff;
                            max-width: 100px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }

                        .d-flex-column {
                            display: flex;
                            flex-direction: column;
                        }

                        .fw-bold {
                            font-weight: bold;
                        }

                        * {
                            font-size: 14px;
                            color: #444;
                        }
                    </style>
                </head>

                <body>
                    <div>
                        <div class="text-center">
                            <h6>Sales reports</span>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">SL. No</th>
                                    <th scope="col">Order ID</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">User</th>
                                    <th scope="col">Total Price</th>
                                    <th scope="col">Discount</th>
                                    <th scope="col">Final Price</th>
                                    <th scope="col">Payment Mode</th>
                                </tr>
                            </thead>
                            <tbody>

                                ${orders
          .map(
            (order, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${order.humanReadableID.toString().replace(/"/g, '')}</td>
                                    <td>${order.createdAt.toISOString().split('T')[0]}</td>
                                    <td>${order.user.email}</td>
                                    <td>${order.totalAmount}</td>
                                    <td>${order.discountAmount}</td>
                                    <td>${order.finalPrice}</td>
                                    <td>${order.paymentMode}</td>
                                </tr>`
          )
          .join('')}

                                <tr>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td>
                                        <div class="d-flex-column text-end">
                                            <br>
                                            <span>Net Total Price:</span>
                                            <span>Net Discount:</span>
                                            <span class="fw-bold">Net Final Price:</span>
                                        </div>
                                    </td>
                                    <td class="">
                                        <div class="d-flex-column">
                                            <br>
                                            <span>${netTotalAmount}</span>
                                            <span>${netDiscount}</span>
                                            <span class="fw-bold">${netFinalAmount}</span>
                                        </div>
                                    </td>
                                </tr>

                            </tbody>
                        </table>

                    </div>
                </body>

                </html>`

      await page.setContent(content)
      await page.pdf({ path: 'sales_report.pdf', format: 'A4' })

      await browser.close()

      const file = `${__dirname}/../sales_report.pdf`
      res.download(file)
    }
  } catch (error) {
    console.error(error);
    next(error)
  }
}





/////////////////////////////////////////////////////////// BANNER ///////////////////////////////

////////////////////to show banner list
const adminBannerList = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const ITEMS_PER_PAGE = 9
    const page = parseInt(req.query.page) || 1
    const skipItems = (page - 1) * ITEMS_PER_PAGE
    const totalCount = await orderModel.countDocuments()
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const banner = await bannerModel.find().sort({ createdAt: -1 }).skip(skipItems)
      .limit(ITEMS_PER_PAGE)
    if (banner) res.render("admin/adminBannerLists", { data: banner, currentPage: page, totalPages: totalPages });
  } catch (error) {
    console.error("Error getting banners:", error);
    throw error;
  }
}




////////////////////to show the page to add new banner
const adminAddbanner = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.render("admin/adminAddBanner");
  } catch (error) {
    console.error(error.message);
  }
}




///////////////////to add new banner
const adminAddedBanner = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const { bannername, bannerurl } = req.body;
  let images = req.file.filename;
  let imageName = `cropped_${images}`;
  const inputFilePath = `public/uploadProductImage/${images}`;
  const outputFilePath = `public/uploadProductImage/${imageName}`;

  try {
    await cropBannerImage(inputFilePath, outputFilePath);
    images = imageName;

    const banner = await bannerModel.create({ bannername, bannerurl, images });
    if (banner) {
      const allBanners = await bannerModel.find();
      res.redirect("/admin/bannerlist");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};





///////////////to show edit banner page
const adminEditBanner = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const bannerId = req.query._id;
    const banner = await bannerModel.findById(bannerId);
    res.render('admin/adminEditBanner', { banner });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}




///////////////////to edit existing banner
const adminEditedBanner = async (req, res) => {
  try {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const { bannername, _id, bannerurl } = req.body;
    const data = { bannername, bannerurl };
    if (req.file && req.file.filename) {
      let images = req.file.filename;
      let imageName = `cropped_${images}`;
      const inputFilePath = `public/uploadProductImage/${images}`;
      const outputFilePath = `public/uploadProductImage/${imageName}`;

      await cropBannerImage(inputFilePath, outputFilePath);
      data.images = imageName;
    }
    const banner = await bannerModel.findByIdAndUpdate(_id, data);

    res.redirect("/admin/bannerlist");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


/////////////////to delete banner
const deleteBanner = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const bannerId = req.query._id;

    // Delete the category with the specified ID
    await bannerModel.deleteOne({ _id: bannerId });

    res.redirect('/admin/bannerlist');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}






module.exports = {
  adminLogin,
  adminLogout,
  verifyAdmin,
  adminHome,
  adminBlockUnblock,
  adminUsersList,
  adminOrderList,
  adminEditOrderListPage,
  adminEditOrderList,
  adminSalesReport,
  adminDownloadReports,
  updateProductStatus,
  adminBannerList,
  adminAddbanner,
  adminAddedBanner,
  adminEditBanner,
  adminEditedBanner,
  deleteBanner,
}