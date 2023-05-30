const pool = require('../db');
const util = require('util');
pool.query = util.promisify(pool.query);

module.exports = {
    async createOrder(prime, payment, subtotal, total, status, user_id) {
        const result = await pool.query(`INSERT INTO CampusShop.Order (prime, payment, subtotal, total, status, user_id) VALUES(?, ?, ?, ?, ?, ?)`,
            [prime, payment, subtotal, total, status, user_id]);
        return result.insertId;
    },
    async createOrderItem(order_id, variant_id, qty) {
        await pool.query(`INSERT INTO CampusShop.OrderItem (order_id, variant_id, qty, status) VALUES(?, ?, ?,?)`, [order_id, variant_id, qty, 'undownloaded']);
    },
    async updateOrderItemStatus(order_id, variant_id, status) {
        await pool.query(`UPDATE CampusShop.OrderItem SET status = ? WHERE order_id = ? AND variant_id = ?`, [status, order_id, variant_id]);
    },
    async updateOrderStatus(order_id, status) {
        await pool.query(`UPDATE CampusShop.Order SET status = ? WHERE id = ?`, [status, order_id]);
    },
    async getOrderById(order_id) {
        const orderRows = await pool.query(`SELECT * FROM CampusShop.Order WHERE id = ?`, [order_id]);
        const orderItemsRows = await pool.query(`SELECT * FROM CampusShop.OrderItem WHERE order_id = ?`, [order_id]);

        const order = orderRows[0];
        if (order) {
            order.orderItems = orderItemsRows;
        }
        return order;
    },
    async getAllOrders() {
        const ordersRows = await pool.query(`SELECT * FROM CampusShop.Order`);
        for (let i = 0; i < ordersRows.length; i++) {
            const orderItemsRows = await pool.query(`SELECT * FROM CampusShop.OrderItem WHERE order_id = ?`, [ordersRows[i].id]);
            ordersRows[i].orderItems = orderItemsRows;
        }
        return ordersRows;
    },

    async getOrdersByUserId(user_id) {
        const ordersRows = await pool.query(`SELECT * FROM CampusShop.Order WHERE user_id = ?`, [user_id]);
        for (let i = 0; i < ordersRows.length; i++) {
            const orderItemsRows = await pool.query(`SELECT * FROM CampusShop.OrderItem WHERE order_id = ?`, [ordersRows[i].id]);
            ordersRows[i].orderItems = orderItemsRows;
        }
        return ordersRows;
    },
    async saveDownloadUrl(orderId, variantId, downloadUrl) {
        const query = 'UPDATE CampusShop.OrderItem SET file = ? WHERE order_id = ? AND variant_id = ?';
        const params = [downloadUrl, orderId, variantId];
        const result = await pool.query(query, params);
        return result;
    }
};
