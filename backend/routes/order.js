const express = require('express');
const router = express.Router();
const orderModel = require('../models/order');
const productModel = require('../models/product');
const paymentProcessor = require('../paymentProcessor');
const jwt = require('jsonwebtoken');
const { router: productsRouter, generateDownloadUrl } = require('./products');

// JWT middleware for admin authorization
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Failed to authenticate token.' });
        }

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'You must be an admin to perform this action.' });
        }

        next();
    });
};

router.get('/all', verifyAdmin, async (req, res) => {
    try {
        const orders = await orderModel.getAllOrders();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error getting all orders' });
    }
});

router.get('/user', async (req, res) => {
    let id = req.query.id;
    try {
        const orders = await orderModel.getOrdersByUserId(id);
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error getting orders for user' });
    }
});

router.post('/create', async (req, res) => {
    const { prime, payment, subtotal, total, user_id, items } = req.body;
    try {
        const orderId = await orderModel.createOrder(prime, payment, subtotal, total, 'unpaid', user_id);
        for (let item of items) {
            await orderModel.createOrderItem(orderId, item.variant_id, item.qty);
        }
        res.status(200).json({ orderId: orderId });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

router.post('/confirm', async (req, res) => {
    const { orderId } = req.body;
    try {
        await orderModel.updateOrderStatus(orderId, 'paid');
        const order = await orderModel.getOrderById(orderId);
        const { user_id, orderItems } = order;
        for (let item of orderItems) {
            console.log(item);
            const { variant_id } = item;
            const productArray = await productModel.getProductByVariantId(variant_id);
            console.log(productArray);
            const { id } = productArray[0];
            const completed_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const downloadUrl = await generateDownloadUrl(id, user_id, orderId, completed_date);
            await orderModel.saveDownloadUrl(orderId, variant_id, downloadUrl);
        }
        res.status(200).json({ message: 'Order payment confirmed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error confirming payment' });
    }
});

router.post('/downloaded', async (req, res) => {
    const { orderId, variantId } = req.body;
    try {
        await orderModel.updateOrderItemStatus(orderId, variantId, 'downloaded');
        res.status(200).json({ message: 'Order item status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order item status' });
    }
});

router.get('/detail', async (req, res) => {
    const orderId = req.query.orderId;
    try {
        const order = await orderModel.getOrderById(orderId);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error getting order' });
    }
});



module.exports = router;
