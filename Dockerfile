FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN npm install -g bun && bun install --frozen-lockfile

# Generate Prisma client
FROM deps AS prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Build Next.js
FROM prisma AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma client and schema for runtime DB setup
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>&1 || true; node server.js"]
