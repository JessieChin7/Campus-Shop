// service/api.js
import axios from "axios";

const API_HOSTNAME = `http://${process.env.API_SERVER}`;
const axiosInstance = axios.create({
    baseURL: API_HOSTNAME,
    // headers: {
    //     Authorization: `Bearer ${process.env.ADMIN_JWT_TOKEN}`,
    // },
});

// Your existing methods...

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


