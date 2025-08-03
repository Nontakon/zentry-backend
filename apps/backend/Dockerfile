# --- STAGE 1: Build ---
    FROM node:20-alpine AS builder
    WORKDIR /usr/src/app
    
    # Enable corepack and set the specific yarn version
    RUN corepack enable
    RUN corepack prepare yarn@1.22.22 --activate
    
    # Copy package.json และ yarn.lock เข้ามาก่อนเพื่อใช้ cache layer ของ Docker
    COPY package.json yarn.lock ./
    RUN yarn install
    
    # Copy โค้ดทั้งหมดเข้ามา
    COPY . .
    
    # Build แอปพลิเคชัน
    RUN yarn build
    
    # --- STAGE 2: Final Image ---
    FROM node:20-alpine
    WORKDIR /usr/src/app
    
    # Enable corepack and set the specific yarn version
    RUN corepack enable
    RUN corepack prepare yarn@1.22.22 --activate
    
    # Copy เฉพาะไฟล์ที่จำเป็นสำหรับ production
    COPY package.json yarn.lock ./
    # Install ALL dependencies (including dev) to run in dev mode
    RUN yarn install
    
    # Copy โค้ดที่ build แล้วจาก stage แรกเข้ามา
    COPY --from=builder /usr/src/app/dist ./dist
    
    # คำสั่งสำหรับรันแอปพลิเคชัน
    CMD ["node", "dist/main"]