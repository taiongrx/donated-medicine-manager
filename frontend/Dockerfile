# ==========================================
# Stage 1: Build React Static Files
# ==========================================
FROM node:18-alpine AS build-stage

WORKDIR /app

# คัดลอกเฉพาะ package files เพื่อทำ caching
COPY package*.json ./
RUN npm install

# คัดลอกซอร์สโค้ดหน้าบ้านทั้งหมด
COPY . .

# สั่ง Build เพื่อสร้างไฟล์ static HTML/JS/CSS (โฟลเดอร์ dist)
RUN npm run build

# ==========================================
# Stage 2: Serve static files with Nginx
# ==========================================
FROM nginx:alpine

# คัดลอกไฟล์คอนฟิก Nginx Reverse Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# คัดลอกไฟล์ที่คอมไพล์แล้วจาก Stage 1 มาไว้ที่ Nginx Web Directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
