// paymentRouter.js
require('dotenv').config();
var express = require('express');
var router = express.Router();
const createConnection = require('../db');
const dbConn = createConnection();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const validateHeaders = (req, res, next) => {
    const contentType = req.headers['content-type'];
    const authorization = req.headers['authorization'];

    if (contentType !== 'application/json') {
        return res.status(400).json({ error: 'Content-Type must be application/json' });
    }

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header is missing or incorrect' });
    }

    next();
};


router.post('/checkout', validateHeaders, async (req, res) => {
    const partner_key = process.env.PAYMENT_PARNER_KEY;
    const merchant_id = process.env.MERCHANT_ID;
    const { order } = req.body;
    try {
        // 驗證 access token 是否有效，如果無效會 throw error
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 以使用者登入的帳戶作資料更新
        const userEmail = decoded.email;
        // Insert the order with all details and status as 'unpaid'
        const getUserQuery = `SELECT id FROM Stylish.User WHERE email = ?`;
        const getUserParams = [userEmail];
        const [userResult] = await new Promise((resolve, reject) => {
            dbConn.query(getUserQuery, getUserParams, (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
        // console.log(userResult);
        const userId = userResult.id;
        const orderQuery = `
            INSERT INTO Stylish.Order (prime, shipping, payment, subtotal, freight, total, status, recipient_name, recipient_phone, recipient_email, recipient_address, recipient_time, user_id)
            VALUES (?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, ?, ?, ?, ?)
        `;
        const orderParams = [
            req.body.prime,
            order.shipping,
            order.payment,
            order.subtotal,
            order.freight,
            order.total,
            order.recipient.name,
            order.recipient.phone,
            order.recipient.email,
            order.recipient.address,
            order.recipient.time,
            userId,
        ];
        const result = await new Promise((resolve, reject) => {
            dbConn.query(orderQuery, orderParams, (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
        const orderId = result.insertId;
        console.log(orderId);

        // 新增的程式碼，用於處理訂單項目
        for (const item of order.list) {
            const variantQuery = `
                SELECT id FROM Stylish.Variant WHERE color_code=? AND \`size\`=? AND product_id=?;
            `;
            const variantParams = [item.color.code, item.size, item.id];
            const [variantResult] = await new Promise((resolve, reject) => {
                dbConn.query(variantQuery, variantParams, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            const variantId = variantResult.id;
            const orderItemQuery = `
                INSERT INTO Stylish.OrderItem (order_id, varient_id, qty) VALUES(?, ?, ?);
            `;
            const orderItemParams = [orderId, variantId, item.qty];
            await new Promise((resolve, reject) => {
                dbConn.query(orderItemQuery, orderItemParams, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        // Process the payment
        const post_data = {
            prime: req.body.prime,
            partner_key: partner_key,
            merchant_id: merchant_id,
            details: "TapPay Test",
            amount: order.total,
            cardholder: {
                phone_number: order.recipient.phone,
                name: order.recipient.name,
                email: order.recipient.email,
                address: order.recipient.address,
            },
            "remember": true
        }
        // console.log(post_data);

        const paymentRes = await axios({
            method: 'post',
            url: 'https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': partner_key,
            },
            data: post_data,
        });
        console.log("payment test successful");

        const response = paymentRes.data;
        // console.log(paymentRes);
        if (response.status === 0) { // Check if payment was successful
            // Update the order status to paid
            const updateOrderQuery = `UPDATE Stylish.Order SET status = 'paid' WHERE id = ?`;
            await new Promise((resolve, reject) => {
                dbConn.query(updateOrderQuery, [orderId], (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });

            // 新增的程式碼，用於更新庫存
            for (const item of order.list) {
                const updateStockQuery = `
                    UPDATE Stylish.Variant
                    SET stock = stock - ?
                    WHERE color_code=? AND \`size\`=? AND product_id=?;
                `;
                const updateStockParams = [parseInt(item.qty), item.color.code, item.size, item.id];
                await new Promise((resolve, reject) => {
                    dbConn.query(updateStockQuery, updateStockParams, (error, results, fields) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                });
            }
            // Insert transaction data into the Transaction table
            const transactionQuery = `INSERT INTO Stylish.Transaction (email, order_id, submit_time, success_time) VALUES(?, ?, ?, ?)`;
            const currentTimestamp = new Date();
            const transactionParams = [
                order.recipient.email,
                orderId,
                currentTimestamp,
                currentTimestamp
            ];
            await new Promise((resolve, reject) => {
                dbConn.query(transactionQuery, transactionParams, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            var data = { number: orderId };
            res.status(200).json({ data: data });
        } else {
            res.status(500).json({ success: false, message: 'payment failed' });
        }
    } catch (error) {
        console.error(error);
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: 'Token expired' });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({ success: false, message: 'Invalid token' });
        } else {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

module.exports = router;