// service/api.js
import axios from "axios";

const API_HOSTNAME = process.env.API_SERVER;
const axiosInstance = axios.create({
    baseURL: API_HOSTNAME,
});

export const signUpUser = (userData) => {
    return axiosInstance.post('/user/signup', userData);
};

export const signInUser = async (userData) => {
    try {
        const response = await axiosInstance.post('/user/signin', userData);
        if (response.status === 200) {
            localStorage.setItem('access_token', response.data.data.access_token);
            localStorage.setItem('user_id', response.data.data.user.id);
        }
        return response;
    } catch (error) {
        console.error('Error during sign in:', error);
        throw error;
    }
};

// User Profile API
export const getUserProfile = (token) => {
    return axiosInstance.get('/user/profile', {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });
};

// Get a single product by ID
export const getProductById = (id) => {
    return axiosInstance.get(`/products/detail?id=${id}`);
};

// Get top five products
export const getTopFiveProducts = () => {
    return axiosInstance.get('/products/top-five');
};

// Get top five products
export const getAllProducts = () => {
    return axiosInstance.get('/products/all');
};

// Get products by category
export const getProductsByCategory = (category) => {
    return axiosInstance.get(`/products/category?category=${category}`);
};

// Create a new product
export const createProduct = (productData, config) => {
    return axiosInstance.post('/products', productData, {
        headers: {
            // add multi-part form data header
            'Content-Type': 'multipart/form-data',
        }
    });
};

// Update a product
export const updateProduct = (id, productData, config) => {
    return axiosInstance.put(`/products/${id}`, productData, config);
};

// Delete a product
export const deleteProduct = (id) => {
    return axiosInstance.delete(`/products/${id}`);
};

// Get shopee reviews
export const getShopeeReviews = async (shopee_id) => {
    try {
        const response = await axiosInstance.get(`/products/shopee-reviews?itemid=${shopee_id}`);
        return response.data;
    } catch (error) {
        console.error('Error during get shopee reviews:', error);
        throw error;
    }
}

// Create a new order
export const createOrder = (orderData) => {
    return axiosInstance.post('/order/create', orderData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });
};

export const updateOrderStatus = (orderId, status) => {
    return axiosInstance.post(`/order/update/${orderId}`, { status });
};

// Get orders by order ID
export const getOrderById = (orderId) => {
    return axiosInstance.get(`/order/detail?orderId=${orderId}`);
};