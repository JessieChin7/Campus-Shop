const express = require('express');
const router = express.Router();
const productModel = require('../models/product');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const REGION = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const axios = require('axios');
const fs = require('fs');
const path = require('path');


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
      } else if (file.fieldname === 'file') {
        folderName = 'CampusShop_files';
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

router.post('/',
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
    { name: 'file', maxCount: 1 } // 新增的欄位，用來處理 PDF 檔案
  ]),
  validateProduct,
  async function (req, res) {
    const newProduct = req.body;
    newProduct.main_image = req.files.main_image ? req.files.main_image[0].location : null;
    newProduct.images = req.files.images ? req.files.images.map(file => file.location) : [];
    newProduct.file = req.files.file ? req.files.file[0].location : null; // 將 PDF 檔案的路徑存入資料庫
    const productId = await productModel.createProduct(newProduct);
    for (const variant of newProduct.variants) {
      variant.product_id = productId;
      await productModel.createVariant(variant);
    }
    res.status(200).json({ newProduct: newProduct });
  });

router.put('/',
  async function (req, res, next) {
    const productId = req.query.id;
    const updatedProduct = req.body;
    const product = await productModel.getProductById(productId);

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Store old file paths into updatedProduct
    updatedProduct.main_image = product.main_image;
    updatedProduct.images = product.images;
    updatedProduct.file = product.file;

    next();
  },
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
    { name: 'file', maxCount: 1 }
  ]),
  async function (req, res) {
    const productId = req.query.id;
    const updatedProduct = req.body;

    // Overwrite old file paths if new files are uploaded
    updatedProduct.main_image = req.files.main_image ? req.files.main_image[0].location : updatedProduct.main_image;
    updatedProduct.images = req.files.images ? req.files.images.map(file => file.location) : updatedProduct.images;
    updatedProduct.file = req.files.file ? req.files.file[0].location : updatedProduct.file;

    await productModel.updateProduct(productId, updatedProduct);

    if (updatedProduct.variants) {
      for (const variant of updatedProduct.variants) {
        variant.product_id = productId;
        await productModel.updateVariant(variant);
      }
    }

    res.status(200).json({ updatedProduct: updatedProduct });
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

router.get('/search', async (req, res) => {
  const keyword = req.query.keyword;
  try {
    const products = await productModel.searchProducts(keyword);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error searching products' });
  }
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


// files
router.get('/download-pdf', async (req, res) => {
  const { product_id, user_id, order_id, completed_date } = req.query;

  if (!product_id || !user_id || !order_id || !completed_date) {
    return res.status(400).json({ message: 'Missing required parameters: product_id, user_id, order_id, completed_date.' });
  }

  try {
    const product = await productModel.getProductById(product_id);
    const pdfUrl = product.file;

    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    const pdfBuffer = response.data;

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const watermarkText = `User ID: ${user_id}, Order ID: ${order_id}, Completed Date: ${completed_date}`;
    const watermark = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Transparent watermark on every page
    const watermarkSize = 12;
    const watermarkColor = rgb(0.95, 0.95, 0.95); // Very light gray, almost white
    const positions = [0.25, 0.5, 0.75]; // Upper, middle and lower part of the page

    pages.forEach(page => {
      const { width, height } = page.getSize();
      positions.forEach(position => {
        const textWidth = watermarkSize * watermarkText.length;
        const x = (width - textWidth) / 2;
        page.drawText(watermarkText, {
          x: x,
          y: height * position,
          size: watermarkSize,
          font: watermark,
          color: watermarkColor,
          opacity: 0,
        });
      });
    });


    const pdfBytes = await pdfDoc.save();

    const key = `client_buffer/${product_id}_${user_id}_${order_id}_${completed_date}.pdf`;
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: pdfBytes,
      ContentType: 'application/pdf',
      ContentLength: pdfBytes.length
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    // Generate presigned URL
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    }), { expiresIn: 3600 });  // 1 hour

    res.status(200).json({ download_url: url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting PDF file' });
  }
});

router.get('/product-by-variant', async function (req, res) {
  let variant_id = req.query.variant_id;
  const product = await productModel.getProductByVariantId(variant_id);
  res.json(product);
});


const generateDownloadUrl = async function (product_id, user_id, order_id, completed_date) {
  console.log(`Generating download URL for product ${product_id}, user ${user_id}, order ${order_id}, completed date ${completed_date}`);
  const product = await productModel.getProductById(product_id);
  const pdfUrl = product.file;

  const response = await axios.get(pdfUrl, {
    responseType: 'arraybuffer',
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const pdfBuffer = response.data;
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  const watermarkText = `User ID: ${user_id}, Order ID: ${order_id}, Completed Date: ${completed_date}`;
  const watermark = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const watermarkSize = 20;
  const watermarkColor = rgb(0.95, 0.95, 0.95);
  const positions = [0.25, 0.5, 0.75];

  pages.forEach(page => {
    const { width, height } = page.getSize();
    positions.forEach(position => {
      const textWidth = watermarkSize * watermarkText.length;
      const x = (width) / 2;
      page.drawText(watermarkText, {
        x: x,
        y: height * position,
        size: watermarkSize,
        font: watermark,
        color: watermarkColor,
        opacity: 0,
      });
    });
  });

  const pdfBytes = await pdfDoc.save();

  const key = `client_buffer/${product_id}_${user_id}_${order_id}_${completed_date}.pdf`;
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: pdfBytes,
    ContentType: 'application/pdf',
    ContentLength: pdfBytes.length
  };

  const command = new PutObjectCommand(uploadParams);
  await s3.send(command);

  // Generate presigned URL
  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key
  }), { expiresIn: 3600 });  // 1 hour

  return url;
}


module.exports = {
  router,
  generateDownloadUrl
};

