const pool = require('../db');
const util = require('util');
pool.query = util.promisify(pool.query);

exports.getProductById = async (id) => {
    const product = await pool.query('SELECT * FROM CampusShop.Product WHERE id = ?', [id]);
    if (!product) {
        throw new Error(`Product with id ${id} not found`);
    }
    const [variantRows] = await pool.query('SELECT * FROM CampusShop.Variant WHERE product_id = ?', [id]);
    return product;
};

exports.getTopFiveProducts = async function () {
    const self = this;
    const query = `
    SELECT p.*, SUM(oi.qty) as total_qty
    FROM CampusShop.Product p
    JOIN CampusShop.Variant v ON p.id = v.product_id
    JOIN CampusShop.OrderItem oi ON v.id = oi.variant_id
    GROUP BY p.id
    ORDER BY total_qty DESC
    LIMIT 5
    `;
    const result = await pool.query(query);
    console.log(result);
    return result.length > 0 ? result[0] : await self.getProductsByIdDesc();
};

exports.getProductsByIdDesc = async () => {
    const result = await pool.query('SELECT * FROM CampusShop.Product ORDER BY id DESC LIMIT 5');
    return result;
};

exports.getProductsByCategory = async (category) => {
    const [rows] = await pool.query('SELECT * FROM CampusShop.Product WHERE category = ?', [category]);
    return rows;
};

exports.createProduct = function (product) {
    return new Promise((resolve, reject) => {
        const query = "INSERT INTO CampusShop.Product (category, title, description, hashtag, price, note, author, main_image, images, catalog) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const imagesStr = JSON.stringify(product.images);
        const params = [product.category, product.title, product.description, product.hashtag, product.price, product.note, product.author, product.main_image, imagesStr, product.catalog];
        pool.query(query, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

exports.updateProduct = async (id, productData) => {
    const { category, title, description, hashtag, price, note, author, main_image, images, catalog } = productData;
    const [result] = await pool.query('UPDATE CampusShop.Product SET category = ?, title = ?, description = ?, hashtag = ?, price = ?, note = ?, author = ?, main_image = ?, images = ?, catalog = ? WHERE id = ?', [category, title, description, hashtag, price, note, author, main_image, images, catalog, id]);
    return result;
};

exports.deleteProduct = async (id) => {
    const [result] = await pool.query('DELETE FROM CampusShop.Product WHERE id = ?', [id]);
    return result;
};

exports.createVariant = async function (variant) {
    const { version, stock, product_id, part } = variant;
    const queryResult = await pool.query('INSERT INTO CampusShop.Variant (version, stock, product_id, part) VALUES (?, ?, ?, ?)', [version, stock, product_id, part]);
    const result = queryResult.insertId;
    return result;
};

exports.updateVariant = async (id, variantData) => {
    const { version, stock, product_id, part } = variantData;
    const queryResult = await pool.query('UPDATE CampusShop.Variant SET version = ?, stock = ?, product_id = ?, part = ? WHERE id = ?', [version, stock, product_id, part, id]);
    const result = queryResult.insertId;
    return result;
};

exports.deleteVariant = async (id) => {
    const queryResult = await pool.query('DELETE FROM CampusShop.Variant WHERE id = ?', [id]);
    const result = queryResult.insertId;
    return result;
};
