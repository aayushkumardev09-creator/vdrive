# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# 2. Install ALL dependencies (devDependencies needed for build)
RUN npm install
RUN cd backend && npm install

# 3. Copy source code
COPY . .

# 4. Build frontend (Vite) and backend (TypeScript)
RUN npm run build

# ---------- Production Stage ----------
FROM node:20-alpine

WORKDIR /app

# 1. Copy built artifacts and package files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist

# 2. Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# 3. Expose the unified server port
EXPOSE 3001

# 4. Start the Express server
CMD ["npm", "start"]
