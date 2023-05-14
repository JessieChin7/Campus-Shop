// service/api.js
import axios from "axios";

const API_HOSTNAME = `http://${process.env.API_SERVER}`;
const axiosInstance = axios.create({
    baseURL: API_HOSTNAME,
    // headers: {
    //     Authorization: `Bearer ${process.env.ADMIN_JWT_TOKEN}`,
    // },
});

// User Sign Up API
export const signUpUser = (userData) => {
    return axiosInstance.post('/signup', userData);
};

// User Sign In API
export const signInUser = (userData) => {
    return axiosInstance.post('/signin', userData);
};

// User Profile API
export const getUserProfile = () => {
    return axiosInstance.get('/profile');
};

// Get a single product by ID
export const getProductById = (id) => {
    return axiosInstance.get(`/products/detail?id=${id}`);
};

// Get top five products
export const getTopFiveProducts = () => {
    return axiosInstance.get('/products/top-five');
};

// Get products by category
export const getProductsByCategory = (category) => {
    return axiosInstance.get(`/products/category?category=${category}`);
};

// Create a new product
export const createProduct = (productData, config) => {
    return axiosInstance.post('/products', productData, config);
};

// Update a product
export const updateProduct = (id, productData, config) => {
    return axiosInstance.put(`/products/${id}`, productData, config);
};

// Delete a product
export const deleteProduct = (id) => {
    return axiosInstance.delete(`/products/${id}`);
};


