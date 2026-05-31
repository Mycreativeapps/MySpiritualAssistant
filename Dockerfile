# ─────────────────────────────────────────────
# Stage 1: Build / Install dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching — faster rebuilds)
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# ─────────────────────────────────────────────
# Stage 2: Production Runtime Image
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from builder stage with correct ownership
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source code with correct ownership
COPY --chown=appuser:appgroup . .

# Use non-root user
USER appuser

# Expose the app port (PORT env var is read by server.js)
EXPOSE 5000

# Health check — AWS ECS / ALB will use this
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api-docs || exit 1

# Start the server
CMD ["node", "server.js"]
