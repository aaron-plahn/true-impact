# Stage 1: Build the React application
FROM node:24.13.0-alpine AS build
WORKDIR /app
COPY apps/web-client/package.json apps/web-client/yarn.lock ./
RUN yarn install --frozen-lock-file
COPY apps/web-client .
RUN yarn run react-scripts build

# Stage 2: Serve the React application with Nginx
FROM nginx:alpine AS client

# Create non-root user and group
RUN addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser

# Fix Nginx runtime folders so a non-root user can write logs and PID files
RUN chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

# Copy configuration and build assets with correct permissions
COPY --chown=appuser:appgroup apps/web-client/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=appuser:appgroup --from=build app/build /usr/share/nginx/html

# Switch to unprivileged port (8080) because non-root users cannot bind to 80
EXPOSE 8080

# Switch to the non-root user explicitly
USER appuser

CMD ["nginx", "-g", "daemon off;"]
