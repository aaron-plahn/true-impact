# Use a Node.js base image
FROM node:24.13.0-alpine AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy configs
COPY apps/server/package.json apps/server/yarn.lock   ./

# Install dependencies
RUN npm i -g @nestjs/cli
RUN yarn install --frozen-lock-file

# Copy the source code
COPY apps/server ./

# Build the server
RUN yarn build

# Production stage
FROM node:24.13.0-alpine AS production

WORKDIR /usr/src/app

# Copy only necessary files from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Expose the port your NestJS application listens on
# TODO env var
EXPOSE $API_PORT

# Start the application
CMD ["node", "dist/main.js"]

# CMD ["tail","-f","/dev/null"]
