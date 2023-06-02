/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        // API_SERVER: 'http://localhost:5000',
        API_SERVER: 'https://campusshop.live/api',
    }
};

module.exports = nextConfig;
