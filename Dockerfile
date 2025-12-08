# -------- BUILD STAGE --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy sources
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript -> dist
RUN npm run build

# -------- RUNTIME STAGE --------
FROM node:20-alpine AS runner

WORKDIR /app

# Install only prod deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/server.js"]
