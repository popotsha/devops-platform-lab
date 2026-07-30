# Angular production image
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS runner

# 1. Copy your build files
COPY --from=builder /app/dist/angular-dashboard/browser /usr/share/nginx/html/browser

# 2. OVERWRITE the default config with your custom one
# Ensure the file in your local directory is named 'nginx.conf'
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
CMD ["/docker-entrypoint.sh"]
