/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        // API_SERVER: 'http://localhost:5000',
        API_SERVER: 'https://campusshop.live/api',
    },
    images: {
        domains: ['jessiestylishbucket.s3.ap-northeast-1.amazonaws.com'],
    },
};

module.exports = nextConfig;
