# 選擇 Node.js 映像的版本
FROM node:16

# 複製和安裝後端應用程式的依賴項
WORKDIR /app/stylish/backend
COPY package*.json ./
RUN npm install

# 複製後端應用程式代碼
COPY . .

# 刪除 bcrypt 模組，重新安裝
RUN rm -rf node_modules/bcrypt && npm install bcryptjs

# 安裝 pm2 作為全局 npm 模塊
RUN npm install -g pm2

# 使用 pm2 啟動應用程式
CMD ["pm2-runtime", "start", "npm", "--", "start"]
