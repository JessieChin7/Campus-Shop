var express = require('express');
var router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();
const REGION = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  }
});
// async function listObjectsV2() {
//   try {
//     const data = await s3.send(new ListObjectsV2Command({ Bucket: process.env.AWS_S3_BUCKET_NAME }));
//     console.log('Objects in S3 bucket:', data.Contents);
//   } catch (err) {
//     console.error('Error fetching objects from S3:', err);
//   }
// }
// listObjectsV2();

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
        folderName = 'STYLiSH_main_image';
      } else if (file.fieldname === 'images') {
        folderName = 'STYLiSH_images';
      } else {
        return cb(new Error('Invalid fieldname'));
      }

      cb(null, `${folderName}/${date}-${file.originalname}`);
    },
  }),
});

const createConnection = require('../db');
const dbConn = createConnection();
const { body, validationResult } = require('express-validator');
const Joi = require('joi');
const imageFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
const validateProduct = [
  body('category').not().isEmpty().withMessage('Category is required'),
  body('title').not().isEmpty().withMessage('Title is required'),
  body('description').not().isEmpty().withMessage('Description is required'),
  body('price')
    .not()
    .isEmpty()
    .withMessage('Price is required')
    .isNumeric()
    .withMessage('Price must be a number'),
  body('texture').not().isEmpty().withMessage('Texture is required'),
  body('wash').not().isEmpty().withMessage('Wash is required'),
  body('place').not().isEmpty().withMessage('Place is required'),
  body('note').not().isEmpty().withMessage('Note is required'),
  body('story').not().isEmpty().withMessage('Story is required'),
  body('images').custom((value, { req }) => {
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      throw new Error('Images are required');
    }
    req.files.images.forEach(file => {
      if (!imageFileTypes.includes(file.mimetype)) {
        throw new Error('Only JPEG and PNG files are allowed for images');
      }
    });
    return true;
  }),
  body('main_image').custom((value, { req }) => {
    if (!req.files || !req.files.main_image || req.files.main_image.length === 0) {
      throw new Error('Main image is required');
    }
    if (!imageFileTypes.includes(req.files.main_image[0].mimetype)) {
      throw new Error('Only JPEG and PNG files are allowed for main image');
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// function count pages
function getTotalPages(categories, keyword, callback) {
  let countQuery = "SELECT COUNT(*) as total_count FROM Stylish.Product";
  if (categories !== 'all' || keyword) {
    countQuery += " WHERE ";
    const conditions = [];
    if (categories !== 'all') {
      conditions.push(`category = '${categories}'`);
    }
    if (keyword) {
      conditions.push(`title LIKE '%${keyword}%'`);
    }
    countQuery += conditions.join(' AND ');
  }
  var totalCount = 0;
  dbConn.query(countQuery, [], function (error, countResult, fields) {
    if (error) {
      console.log(error);
      return res.status(500).send({ error: true });
    }
    totalCount = countResult[0].total_count;
    const perPage = 6;
    const totalPages = Math.ceil(totalCount / perPage);
    return callback(null, totalPages);
  });
}

// ***Product List API*** 
router.get('/:category(all|women|men|accessories)', function (req, res) {
  const categories = req.params.category;
  if (!categories) {
    return res.status(400).send({ error: true, message: 'Please provide categories' });
  }
  if (!['all', 'women', 'men', 'accessories'].includes(categories)) {
    return res.status(400).send("Invalid categories parameter");
  }

  // 新增 page 參數
  let page;
  if (req.query.paging) {
    if (!Number.isInteger(Number(req.query.paging))) {
      res.status(400).send("Page parameter must be an integer");
      return;
    }
    if (req.query.paging < 0) {
      res.status(400).send("Page parameter must be nonnegative");
      return;
    }
    page = parseInt(req.query.paging);
  } else {
    page = 0;
  }
  const perPage = 6; // 每頁六筆資料
  const offset = (page) * perPage; // 設定 LIMIT 的搜尋起點
  const limit = `${offset}, ${perPage}`; // 設定 LIMIT
  let query;
  let queryParams;

  if (categories === 'all') {
    query = `SELECT p.id, p.category , p.title, p.description, p.price,p.texture ,p.wash ,p.place ,p.note ,p.story ,p.main_image ,p.images,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('color_code', v.color_code, 'size', v.size, 'stock', v.stock))
     FROM Stylish.Variant v WHERE v.product_id = p.id) AS variants,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('code', c.code, 'name', c.name))
     FROM Stylish.Colors c INNER JOIN Stylish.Variant v ON c.code = v.color_code WHERE v.product_id = p.id) AS colors,
     (SELECT JSON_ARRAYAGG(s.size)
     FROM (SELECT DISTINCT size FROM Stylish.Variant WHERE product_id = p.id) s) AS sizes
    FROM Stylish.Product p
    ORDER BY p.id
    LIMIT ${limit};
    `;
    queryParams = [];
  } else {
    query = `SELECT p.id, p.category , p.title, p.description, p.price,p.texture ,p.wash ,p.place ,p.note ,p.story ,p.main_image ,p.images,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('color_code', v.color_code, 'size', v.size, 'stock', v.stock))
     FROM Stylish.Variant v WHERE v.product_id = p.id) AS variants,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('code', c.code, 'name', c.name))
     FROM Stylish.Colors c INNER JOIN Stylish.Variant v ON c.code = v.color_code WHERE v.product_id = p.id) AS colors,
     (SELECT JSON_ARRAYAGG(s.size)
     FROM (SELECT DISTINCT size FROM Stylish.Variant WHERE product_id = p.id) s) AS sizes
    FROM Stylish.Product p
    WHERE p.category = ?
    ORDER BY p.id
    LIMIT ${limit};
    `;
    queryParams = [categories];
  }

  dbConn.query(query, queryParams, function (error, results, fields) {
    if (error) {
      console.log(error);
      return res.status(500).send({ error: true });
    }
    if (results.length === 0) {
      const message = categories === 'all' ? 'There are no products' : `There are no ${categories} products`;
      return res.status(400).send({ error: true, message: message });
    }
    getTotalPages(categories, req.query.keyword, function (error, totalPages) {
      if (error) {
        console.log(error);
        return res.status(500).send({ error: true });
      }
      const parsedResults = results.map((item) => {
        const parsedItem = { ...item };
        parsedItem.colors = JSON.parse(item.colors);
        parsedItem.sizes = JSON.parse(item.sizes);
        parsedItem.variants = JSON.parse(item.variants);
        parsedItem.images = JSON.parse(item.images);
        return parsedItem;
      });
      // 計算下一頁的頁數
      const nextPaging = (offset + perPage < totalPages * perPage) ? page + 1 : null;
      const responseData = { data: parsedResults };
      if (nextPaging !== null) {
        responseData['next_paging'] = nextPaging;
      }
      return res.status(200).send(responseData);
    });
  });
});

// ***Product Search API*** 
router.get('/search', function (req, res) {
  // 新增 page 參數
  let page;
  if (req.query.paging) {
    if (!Number.isInteger(Number(req.query.paging))) {
      res.status(400).send("Page parameter must be an integer");
      return;
    }
    if (req.query.paging < 0) {
      res.status(400).send("Page parameter must be nonnegative");
      return;
    }
    page = parseInt(req.query.paging);
  } else {
    page = 0;
  }
  const keyword = req.query.keyword;
  const perPage = 6; // 每頁六筆資料
  const offset = (page) * perPage; // 設定 LIMIT 的搜尋起點
  const limit = `${offset}, ${perPage}`; // 設定 limit
  let query;

  if (!keyword) {
    return res.status(400).send({ error: true, message: 'Please provide keyword' });
  }
  query = `SELECT p.id, p.category , p.title, p.description, p.price,p.texture ,p.wash ,p.place ,p.note ,p.story ,p.main_image ,p.images,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('color_code', v.color_code, 'size', v.size, 'stock', v.stock))
     FROM Stylish.Variant v WHERE v.product_id = p.id) AS variants,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('code', c.code, 'name', c.name))
     FROM Stylish.Colors c INNER JOIN Stylish.Variant v ON c.code = v.color_code WHERE v.product_id = p.id) AS colors,
     (SELECT JSON_ARRAYAGG(s.size)
     FROM (SELECT DISTINCT size FROM Stylish.Variant WHERE product_id = p.id) s) AS sizes
    FROM Stylish.Product p
    WHERE p.title LIKE '%${keyword}%'
    ORDER BY p.id
    LIMIT ${limit};
    `;

  dbConn.query(query, function (error, results, fields) {
    if (error) {
      console.log(error);
      return res.status(500).send({ error: true });
    }
    if (results.length === 0) {
      return res.status(400).send({ error: true, message: 'There is no match products' });
    }
    getTotalPages(req.params.category, keyword, function (error, totalPages) {
      if (error) {
        console.log(error);
        return res.status(500).send({ error: true });
      }

      const parsedResults = results.map((item) => {
        const parsedItem = { ...item };
        parsedItem.colors = JSON.parse(item.colors);
        parsedItem.sizes = JSON.parse(item.sizes);
        parsedItem.variants = JSON.parse(item.variants);
        parsedItem.images = JSON.parse(item.images);
        return parsedItem;
      });
      // 計算下一頁的頁數
      const nextPaging = (offset + perPage < totalPages * perPage) ? page + 1 : null;
      const responseData = { data: parsedResults };
      if (nextPaging !== null) {
        responseData['next_paging'] = nextPaging;
      }
      return res.status(200).send(responseData);
    });
  });
});

// ***Product Detail API*** 
router.get('/detail', function (req, res) {
  let id = req.query.id;
  if (!id) {
    return res.status(400).send({ error: true, message: 'Please provide id' });
  }
  var query = `SELECT p.id, p.category , p.title, p.description, p.price,p.texture ,p.wash ,p.place ,p.note ,p.story ,p.main_image ,p.images,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('color_code', v.color_code, 'size', v.size, 'stock', v.stock))
   FROM Stylish.Variant v WHERE v.product_id = p.id) AS variants,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('code', c.code, 'name', c.name))
   FROM Stylish.Colors c INNER JOIN Stylish.Variant v ON c.code = v.color_code WHERE v.product_id = p.id) AS colors,
   (SELECT JSON_ARRAYAGG(s.size)
   FROM (SELECT DISTINCT size FROM Stylish.Variant WHERE product_id = p.id) s) AS sizes
  FROM Stylish.Product p
  WHERE p.id =${id};`;

  dbConn.query(query, function (error, results, fields) {
    if (error) {
      console.log(error);
      return res.status(500).send({ error: true });
    }
    if (results.length === 0) {
      return res.status(400).send({ error: true, message: 'There is no match products' });
    }

    const parsedResults = results.map((item) => {
      const parsedItem = { ...item };
      parsedItem.colors = JSON.parse(item.colors);
      parsedItem.sizes = JSON.parse(item.sizes);
      parsedItem.variants = JSON.parse(item.variants);
      parsedItem.images = JSON.parse(item.images);
      return parsedItem;
    });
    const responseData = { data: parsedResults };
    return res.status(200).send(responseData);
  });
});

// 在router.post那一行之前添加這個中間件
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}


// ***Product Create API*** 
router.post('/create', logErrors, upload.fields([{ name: 'main_image', maxCount: 1 }, { name: 'images', maxCount: 5 }]), validateProduct, function (req, res) {
  const productData = {};
  // deal with the colors and varients data
  const colorsRegex = /colors\[\d+\]\[([^\]]+)\]/;
  const variantsRegex = /variants\[\d+\]\[([^\]]+)\]/;

  // if data format like this `[{"size": "S", "stock": 5, "color_code": "334455"}]`(e.g. Swagger UI)
  // format into array object like this `colors[0][code]="e60073"`
  if (typeof req.body.colors === 'string') {
    req.body.colors = JSON.parse(req.body.colors);
    req.body.colors = Array.from(Object.values(req.body.colors));
  }
  if (typeof req.body.variants === 'string') {
    req.body.variants = JSON.parse(req.body.variants);
    req.body.variants = Array.from(Object.values(req.body.variants));
  }

  // combine the colors and varients data into productData
  Object.keys(req.body).forEach(key => {
    const matchColors = key.match(colorsRegex);
    const matchVariants = key.match(variantsRegex);
    if (matchColors) {
      const index = parseInt(key.match(/\[(\d+)\]/)[1]);
      const colorKey = matchColors[1];
      if (!productData.colors) {
        productData.colors = [];
      }
      if (!productData.colors[index]) {
        productData.colors[index] = {};
      }
      productData.colors[index][colorKey] = req.body[key];
    } else if (matchVariants) {
      const index = parseInt(key.match(/\[(\d+)\]/)[1]);
      const variantKey = matchVariants[1];
      if (!productData.variants) {
        productData.variants = [];
      }
      if (!productData.variants[index]) {
        productData.variants[index] = {};
      }
      productData.variants[index][variantKey] = req.body[key];
    } else {
      productData[key] = req.body[key];
    }
  });

  // insert into database
  product = productData
  dbConn.beginTransaction(async (err) => {
    if (err) throw err;

    try {
      dbConn.query(`INSERT INTO Stylish.Product (category, title, description, price, texture, wash, place, note, story, main_image, images)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        product.category,
        product.title,
        product.description,
        product.price,
        product.texture,
        product.wash,
        product.place,
        product.note,
        product.story,
        req.files['main_image'][0].location,
        JSON.stringify(req.files['images'].map(file => file.location))
      ]);

      const getLastid = `SELECT LAST_INSERT_ID() AS product_id`;
      const [rows] = await new Promise((resolve, reject) => {
        dbConn.query(getLastid, (error, results, fields) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
      const product_id = rows.product_id;

      for (const color of JSON.parse(JSON.stringify(product.colors))) {
        await dbConn.query(`INSERT INTO Stylish.Colors (code, name)
                            SELECT * FROM (SELECT ?, ?) AS tmp
                            WHERE NOT EXISTS (
                              SELECT code FROM Stylish.Colors WHERE code = ?
                            )`, [color.code, color.name, color.code]);
      }

      for (const variant of JSON.parse(JSON.stringify(product.variants))) {
        await dbConn.query(`INSERT INTO Stylish.Variant (product_id, color_code, size, stock)
                            SELECT * FROM (SELECT ?, ?, ?, ?) AS tmp
                            WHERE NOT EXISTS (
                              SELECT product_id, color_code, size FROM Stylish.Variant WHERE product_id = ? AND color_code = ? AND size = ?
                            )`, [product_id, variant.color_code, variant.size, variant.stock, product_id, variant.color_code, variant.size]);
      }

      dbConn.commit((err) => {
        if (err) {
          dbConn.rollback(() => {
            throw err;
          });
        }
        res.json({ success: true, message: 'Product created successfully!' });
      });
    } catch (error) {
      dbConn.rollback(() => {
        throw error;
      });
    }
  });
});

module.exports = router;