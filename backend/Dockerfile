FROM node:20-alpine AS builder
# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]
