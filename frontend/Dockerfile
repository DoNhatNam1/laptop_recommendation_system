# Stage 1: Build React application
FROM node:22-alpine as build

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt dependencies cho build
RUN npm install -g vite

# Copy package.json trước để tận dụng cache
COPY package.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Sử dụng npm install với --legacy-peer-deps để bỏ qua xung đột
RUN npm install --no-audit --legacy-peer-deps

# Cài đặt dependencies cho minification
RUN npm install terser --save-dev --legacy-peer-deps

# Copy source code
COPY . .

# Debug - xem thư mục source
RUN echo "Source files:" && ls -la

# Kiểm tra môi trường Node
RUN echo "Node version: $(node -v)" && echo "NPM version: $(npm -v)"

# Build ứng dụng
RUN npm run build

# Debug - kiểm tra xem build có thành công không
RUN echo "Build files:" && ls -la dist

# Stage 2: Nginx server
FROM nginx:1.28-alpine

# Tạo thư mục và đặt quyền
RUN mkdir -p /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Copy build files từ stage trước
COPY --from=build /app/dist /usr/share/nginx/html/

# Copy Nginx config
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Debug - kiểm tra files trong nginx html dir
RUN echo "Nginx HTML directory:" && ls -la /usr/share/nginx/html/

# Đặt quyền thích hợp 
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]