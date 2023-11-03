const bodyParser = require('body-parser')
const adminRoute = require('../routes/adminRoutes')
const userRoute = require('../routes/userRoutes')
mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const sharp = require('sharp');
const { configDotenv } = require('dotenv')
const userModel = require('../models/userModel')
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const cropImage = require("../multer/prodImageCrop")
const fs = require('fs');
const path = require('path');


///////////////////////////////////////////////////////////// ADNIN PRODUCT MANAGER //////////////////////////////////////////////////////


///////////////////to disaply admin side products list page
const adminProducts = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const product = await productModel.find().populate('categoryname')
        res.render('admin/adminProducts', { data: product })

    } catch (error) {
        console.log(error.message)
    }
}




///////////////////to display admin side add product page
const adminAddProductPage = async (req, res) => {         // to render the add category page for admin
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const category = await categoryModel.find()
        res.render('admin/adminAddProduct', { data: category })
    } catch (error) {
        console.log(error.message)
    }
}





//////////////////////to add new products
const adminAddProduct = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    let product = req.body;
    product.price = product.mrp;
    
    await cropImage.crop(req)
    const images = req.files.map(file => file.filename);

    product.image = images;
    try {
        await productModel.create(product);
        res.redirect("/admin/adminproducts");
    } catch (error) {
        console.log(error.message);
    }
}




///////////////////////to display admin side edit product page
const adminEditProductPage = async (req, res) => {                 //To GET edit products page by admin .
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const productId = req.query._id;
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const category = await categoryModel.find();
        res.render('admin/adminEditProduct', { productId: productId, products: product, category });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}




/////////////////////to edit product from admin side
const adminEditProduct = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const id = req.query._id;

        // Find the product by ID
        const productDoc = await productModel.findById(id);

        if (!productDoc) {
            return res.status(404).send('Product not found');
        }

        // Find the category associated with the product
        const categoryy = await categoryModel.findById(productDoc.categoryname);

        if (!categoryy) {
            return res.status(404).send('Category not found for the product');
        }

        // Extract the offerPercentage from the category
        const offerPercentage = categoryy.offerPercentage;
        const validProductId = new mongoose.Types.ObjectId(id);
        const updatedProductData = {
            productname: req.body.productname,
            categoryname: req.body.categoryname,
            description: req.body.description,
            stock: req.body.stock,
            price: req.body.price,
            mrp: req.body.mrp,
            productOffer: req.body.productOffer,
            status: req.body.status
        };

        // Update the price if the offerPercentage is 0 and productOffer is greater than 0
        if (offerPercentage === 0 && updatedProductData.productOffer > 0) {
            updatedProductData.price = updatedProductData.productOffer;
        }

        const image = [];

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const imageName = `cropped_${file.filename}`;

                await sharp(file.path)
                    .resize(920, 920, { fit: 'cover' })
                    .toFile(`public/uploadProductImage/${imageName}`);

                image.push(imageName);
            }
        }

        // Update the product with the new data, including the updated price and images
        await productModel.findByIdAndUpdate(id, { $push: { image: { $each: image } } }, { new: true });

        // Find the product by ID and update the data
        const updateProduct = await productModel.findByIdAndUpdate(validProductId, updatedProductData);

        if (!updateProduct) {
            return res.status(404).send('Product not found or not updated.');
        } else {
            const products = await productModel.find();
            res.redirect('/admin/adminproducts');
        }

    } catch (error) {
        console.log(error.message);
    }
}





////////////////////to delete product 
const adminDeleteProduct = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const productId = req.query._id;
        // Use the correct field to specify the category ID in the query
        await productModel.deleteOne({ _id: productId });

        res.redirect('/admin/adminproducts');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}




//////////////////////to delete product image
const adminDeleteImage = async (req, res) => {
    const { id, file } = req.body;
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        // Construct the image file path
        const path = require('path');
        const imagePath = path.join(__dirname, '..', 'public', 'uploadProductImage', file);

        // Check if the file exists
        const fs = require('fs');
        if (fs.existsSync(imagePath)) {
            // File exists, proceed with deletion.
            fs.unlinkSync(imagePath); // This will synchronously delete the file

            // Update the product in the database
            await productModel.findByIdAndUpdate(id, { $pull: { image: file } });

            res.status(200).json({ success: true });
        } else {
            console.error("File does not exist:", imagePath);
            res.status(404).json({ success: false, message: 'Image not found' });
        }
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ success: false, message: 'Image deleting failed' });
    }
};




module.exports = {
    adminProducts,
    adminAddProductPage,
    adminAddProduct,
    adminEditProductPage,
    adminEditProduct,
    adminDeleteProduct,
    adminDeleteImage,

}

