const express = require('express');
const router = express.Router();
const orderModel = require('../models/order');
const paymentProcessor = require('../paymentProcessor');


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


router.post('/confirm/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    try {
        const isPaid = await paymentProcessor.confirmPayment(orderId);
        if (isPaid) {
            await orderModel.updateOrderStatus(orderId, '已付款');
            res.status(200).json({ message: 'Order payment confirmed' });
        } else {
            res.status(400).json({ message: 'Payment not confirmed' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error confirming payment' });
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
