# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Inlined at build time for client components (UserMenu → Admin Console link).
# CI passes the EC2 NodePort URL; local defaults to localhost:4200.
ARG NEXT_PUBLIC_ADMIN_CONSOLE_URL=http://localhost:4200
ENV NEXT_PUBLIC_ADMIN_CONSOLE_URL=$NEXT_PUBLIC_ADMIN_CONSOLE_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the standalone build and static files
# When using output: 'standalone', Next.js creates a folder at .next/standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
