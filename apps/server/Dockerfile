# Use a Node.js base image
FROM node:24-alpine AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY ../apps/server/package*.json ./
COPY ../yarn.lock ./

# Install dependencies
RUN npm i -g @nestjs/cli
RUN yarn install --frozen-lock-file

# Copy the rest of the application code
COPY ../apps/server .

# Build the application
RUN yarn run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /usr/src/app

# Copy only necessary files from the build stage
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Expose the port your NestJS application listens on
# TODO env var
EXPOSE $API_PORT

# Start the application
CMD ["node", "dist/main.js"]

# CMD ["tail","-f","/dev/null"]
