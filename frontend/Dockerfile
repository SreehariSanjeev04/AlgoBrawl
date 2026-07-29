# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies only (layer cached unless package.json changes)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production \
    HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]