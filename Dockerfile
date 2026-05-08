# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for stable same-origin API routing
ARG VITE_RUNTIME_MODE=docker
ARG VITE_API_BASE_URL=/api
ENV VITE_RUNTIME_MODE=$VITE_RUNTIME_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets from build stage
COPY --from=build /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
