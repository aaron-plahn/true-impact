# Stage 1: Build the React application
FROM node:24.13.0-alpine AS build
WORKDIR /app
COPY apps/web-client/package.json apps/web-client/yarn.lock ./
RUN yarn install --frozen-lock-file
COPY apps/web-client .
RUN yarn run react-scripts build

# Stage 2: Serve the React application with Nginx
FROM nginx:alpine AS client
# create non-root user
RUN addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser

# Note that this is important because we need a fallback to `index.html` for client-side routing or else manually refreshes will return 404s
COPY --chown=appuser:appgroup apps/web-client/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=appuser:appgroup --from=build app/build /usr/share/nginx/html
EXPOSE 80
# USER appuser
RUN echo "Static asset server for client started"
CMD ["nginx", "-g", "daemon off;"]
