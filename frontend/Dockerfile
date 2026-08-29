# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm ci --ignore-scripts

# ── Stage 2: Build the Next.js app ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args injected at build time for Railway
ARG INTERNAL_BACKEND_URL
ARG NEXT_PUBLIC_API_URL

ENV INTERNAL_BACKEND_URL=$INTERNAL_BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built output (standalone mode)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Railway injects PORT at runtime
EXPOSE 3009
ENV PORT=3009
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
