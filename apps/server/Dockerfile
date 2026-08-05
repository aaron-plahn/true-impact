# Use a Node.js base image
FROM node:24.13.0-alpine AS build

# Set the working directory
WORKDIR /usr/src/app

RUN echo "Building the server for NODE_ENV: $NODE_ENV"

# Copy the source code
COPY apps/server ./

# Install dependencies
RUN npm i -g @nestjs/cli
RUN yarn install --frozen-lock-file



RUN ls node_modules

# Build the server
RUN yarn build

# Production stage
FROM node:24.13.0-alpine AS production

# create non-root user
RUN addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser

# Copy configs
COPY --chown=appuser:appgroup apps/server/package.json apps/server/yarn.lock   ./

WORKDIR /usr/src/app

# Copy only necessary files from the build stage
COPY --chown=appuser:appgroup --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=build /usr/src/app/dist ./dist

# Expose the port your NestJS application listens on
# TODO env var
EXPOSE $API_PORT

USER appuser

# Start the application
CMD ["node", "dist/main.js"]

# CMD ["tail","-f","/dev/null"]
