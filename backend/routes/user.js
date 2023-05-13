require('dotenv').config();
const jwt = require('jsonwebtoken');
var express = require('express');
var router = express.Router();
const pool = require('../db');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const userModel = require('../models/user');
const validateUserData = (userData) => {
    const errors = {};

    // Check if email is valid
    if (userData.provider === "native" && !/\S+@\S+\.\S+/.test(userData.email)) {
        errors.email = "Invalid email address";
    }

    // Check if password length is greater than 5 if provider is native
    if (userData.provider === "native" && userData.password.length < 6) {
        errors.password = "Password should be at least 6 characters long";
    }

    // Check if provider is either native or facebook
    if (!["native", "facebook"].includes(userData.provider)) {
        errors.provider = "Provider must be either native or facebook";
    }

    // Check if email is empty
    if (userData.provider === "native" && !userData.email) {
        errors.email = "Email cannot be empty";
    }

    // Check if password is empty
    if (userData.provider === "native" && !userData.password) {
        errors.password = "Password cannot be empty";
    }

    return errors;
};

// User Sign Up API
router.post('/signup', async function (req, res) {
    const userData = req.body;
    const errors = validateUserData(userData);
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }
    const { name, email, password, provider, access_token, role } = req.body;
    let fbUser = null;
    let picture = null;
    const userEmail = fbUser ? fbUser.data.email : email;
    const existingUser = await userModel.getUserByEmail(userEmail);
    if (existingUser.length > 0) {
        return res.status(409).json({ success: false, message: 'User already exists' });
    }
    // insert user into database
    const insertUser = await userModel.createUser(fbUser ? fbUser.data.name : name, userEmail, password, provider, picture, role);
    // Generate JWT token
    const token = jwt.sign({ provider: provider, name: name, email: userEmail, picture: picture, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // return token, token expiration time and user info
    const user = {
        id: insertUser.insertId,
        provider: provider,
        name: fbUser ? fbUser.data.name : name,
        email: userEmail,
        picture: picture,
        role: role
    };
    const data = {
        access_token: token,
        access_expired: 3600,
        user: user
    };
    res.status(200).json({ data: data });
});

// User Sign In API
router.post('/signin', async function (req, res) {
    const { email, password, provider } = req.body;
    let picture = null;
    try {
        if (provider === 'native') {
            // Verify email and password for native signin
            if (!email || !password) {
                throw { status: 403, message: 'Email and password are required' };
            }
            const user = await userModel.signIn(email, password);

            // Generate JWT token
            const token = jwt.sign({ provider: user.provider, name: user.name, email: user.email, picture: user.picture, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Return token, token expiration time, and user info
            const data = {
                access_token: token,
                access_expired: 3600,
                user: {
                    id: user.id,
                    provider: user.provider,
                    name: user.name,
                    email: user.email,
                    picture: picture
                }
            };
            res.status(200).json({ data: data });

        } else {
            throw { status: 400, message: 'Invalid provider' };
        }
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({ success: false, message: message });
    }
});

// User Profile API
router.get('/profile', async function (req, res) {
    try {
        // 取得 access token
        const token = req.headers.authorization.split(' ')[1];
        // 驗證 access token 是否有效，如果無效會 throw error
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decoded.email;
        const userProvider = decoded.provider;
        const userName = decoded.name;
        const userPicture = decoded.picture;
        const userRole = decoded.role;
        res.status(200).json({
            data: {
                provider: userProvider,
                name: userName,
                email: userEmail,
                picture: userPicture,
                role: userRole
            }
        });
    } catch (error) {
        console.error(error);
        // 根據 error 的類型回傳不同的錯誤訊息
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