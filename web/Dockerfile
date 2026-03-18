# Production Dockerfile — uses pre-built .next output
# Run: npm run build locally first, then docker compose up -d

FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling and wget for healthcheck
RUN apk add --no-cache dumb-init wget

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copy pre-built Next.js output and static assets
COPY .next ./.next
COPY public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "next", "start"]
