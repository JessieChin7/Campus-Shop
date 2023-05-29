const pool = require('../db');
const util = require('util');
pool.query = util.promisify(pool.query);

exports.getAllProducts = async function () {
    const rows = await pool.query('SELECT * FROM CampusShop.Product WHERE status = "show"');
    return rows;
};

exports.getProductById = async (id) => {
    const productRows = await pool.query('SELECT * FROM CampusShop.Product WHERE id = ?', [id]);
    const product = productRows[0]; // 取得產品資料

    if (!product) {
        throw new Error(`Product with id ${id} not found`);
    }

    const variantRows = await pool.query('SELECT * FROM CampusShop.Variant WHERE product_id = ?', [id]);

    // 將 variantRows 的每一個項目轉換為 JavaScript 物件，並存入 product 的 variants 屬性中
    product.variants = variantRows.map(variantRow => {
        return {
            version: variantRow.version,
            stock: variantRow.stock,
            id: variantRow.id,
            product_id: variantRow.product_id,
            part: variantRow.part
        };
    });

    return product;
};

exports.getVariantById = async function (variant_id) {
    const query = 'SELECT * FROM CampusShop.Variant WHERE id = ?';
    const result = await pool.query(query, [variant_id]);
    return result;
};

exports.getTopFiveProducts = async function () {
    const self = this;
    const query = `
    SELECT p.*, SUM(oi.qty) as total_qty
    FROM CampusShop.Product p
    JOIN CampusShop.Variant v ON p.id = v.product_id
    JOIN CampusShop.OrderItem oi ON v.id = oi.variant_id
    WHERE p.status = 'show'
    GROUP BY p.id
    ORDER BY total_qty DESC
    LIMIT 5
    `;
    const result = await pool.query(query);
    return result.length > 0 ? result : await self.getProductsByIdDesc();
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

exports.updateProduct = async function (productId, updatedProduct) {
    // Get the old product data first
    const oldProductData = await this.getProductById(productId);
    // Merge old data with updated data
    const newProductData = { ...oldProductData, ...updatedProduct };
    const { category, title, description, hashtag, price, note, author, main_image, images, catalog, file } = newProductData;
    const imagesStr = JSON.stringify(images);
    console.log(newProductData);
    const query = "UPDATE CampusShop.Product SET category = ?, title = ?, description = ?, hashtag = ?, price = ?, note = ?, author = ?, main_image = ?, images = ?, catalog = ?, file = ? WHERE id = ?";
    const params = [category, title, description, hashtag, price, note, author, main_image, imagesStr, catalog, file, productId];
    const result = await pool.query(query, params);
    return result;
}

exports.updateVariant = async function (variant) {
    // Get the old variant data first
    const oldVariantData = await this.getVariantById(variant.id); // Assuming this method exists
    // Merge old data with updated data
    const newVariantData = { ...oldVariantData, ...variant };
    const { version, stock, product_id, part, id } = newVariantData;
    const query = 'UPDATE CampusShop.Variant SET version = ?, stock = ?, product_id = ?, part = ? WHERE id = ?';
    const params = [version, stock, product_id, part, id];
    const result = await pool.query(query, params);
    return result;
}

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

exports.deleteVariant = async (id) => {
    const queryResult = await pool.query('DELETE FROM CampusShop.Variant WHERE id = ?', [id]);
    const result = queryResult.insertId;
    return result;
};

exports.searchProducts = async (keyword) => {
    const productRows = await pool.query(`SELECT * FROM CampusShop.Product WHERE title LIKE ?`, ['%' + keyword + '%']);
    return productRows;
};