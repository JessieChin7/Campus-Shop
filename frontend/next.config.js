/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        API_SERVER: 'localhost:5000',
    }
};

module.exports = nextConfig;
