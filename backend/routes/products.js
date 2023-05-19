const express = require('express');
const router = express.Router();
const productModel = require('../models/product');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const REGION = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const axios = require('axios');

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentLength: 500000000,
    // acl: 'public-read',
    key: function (req, file, cb) {
      const date = new Date()
        .toISOString()
        .replace(/[-T:\.Z]/g, '')
        .replace(/\d{3}$/, '');
      let folderName;
      if (file.fieldname === 'main_image') {
        folderName = 'CampusShop_main_image';
      } else if (file.fieldname === 'images') {
        folderName = 'CampusShop_images';
      } else {
        return cb(new Error('Invalid fieldname'));
      }

      cb(null, `${folderName}/${date}-${file.originalname}`);
    },
  }),
});

function validateProduct(req, res, next) {
  const product = req.body;
  if (!product.category || !product.title || !product.price || !product.variants) {
    return res.status(400).send({ message: "Missing required fields: category, title, price, variants" });
  }
  product.price = Number(product.price);
  // Parse variants from string to JSON
  product.variants = JSON.parse(product.variants);
  product.variants.forEach(variant => {
    if (!variant.version || !variant.stock || !variant.part) {
      return res.status(400).send({ message: "Missing required fields in variant: version, stock, part" });
    }
    variant.stock = Number(variant.stock);
  });
  next();
}

router.get('/detail', async function (req, res) {
  let id = req.query.id;
  const product = await productModel.getProductById(id);
  res.json(product);
});

router.get('/top-five', async function (req, res) {
  const products = await productModel.getTopFiveProducts();
  res.json(products);
});

router.get('/category', async function (req, res) {
  let category = req.query.category;
  const products = await productModel.getProductsByCategory(category);
  res.json(products);
});

router.post('/', upload.fields([{ name: 'main_image', maxCount: 1 }, { name: 'images', maxCount: 5 }]), validateProduct, async function (req, res) {
  const newProduct = req.body;
  newProduct.main_image = req.files.main_image ? req.files.main_image[0].location : null;
  newProduct.images = req.files.images ? req.files.images.map(file => file.location) : [];
  const productId = await productModel.createProduct(newProduct);
  for (const variant of newProduct.variants) {
    variant.product_id = productId;
    await productModel.createVariant(variant);
  }
  res.status(200).json({ newProduct: newProduct });
});

router.put('/:id', validateProduct, async function (req, res) {
  const updatedProduct = req.body;
  if (updatedProduct.price) updatedProduct.price = Number(updatedProduct.price);
  const result = await productModel.updateProduct(req.params.id, updatedProduct);
  updatedProduct.variants.forEach(async variant => {
    if (variant.id) {
      await productModel.updateVariant(variant.id, variant);
    } else {
      variant.product_id = req.params.id;
      await productModel.createVariant(variant);
    }
  });
  res.json(result);
});

router.delete('/:id', async function (req, res) {
  const result = await productModel.deleteProduct(req.params.id);
  await productModel.deleteVariantsByProduct(req.params.id);
  res.status(200).json({ product_id: req.params.id });
});

router.get('/all', async function (req, res) {
  const products = await productModel.getAllProducts();
  res.json(products);
});


//comments

const getShopeeReviews = async (url) => {
  try {
    const response = await axios.get(url);
    const data = response.data;
    const reviews = data.data.ratings;

    return reviews.map(review => ({
      author_username: review.author_username,
      rating_star: review.rating_star,
      comment: review.comment,
      ctime: review.ctime,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

router.get('/shopee-reviews', async function (req, res) {
  const url = `https://shopee.tw/api/v2/item/get_ratings?filter=1&flag=1&itemid=${req.query.itemid}&limit=50&offset=0&shopid=7461532&type=5`;
  const reviews = await getShopeeReviews(url);
  res.json(reviews);
});

module.exports = router;
