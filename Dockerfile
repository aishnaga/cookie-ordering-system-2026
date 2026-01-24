FROM node:20-slim

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies (rebuilds native modules for Linux)
RUN cd client && npm ci
RUN cd server && npm ci --build-from-source

# Copy source code
COPY client ./client
COPY server ./server

# Build frontend
RUN cd client && npm run build

# Create data directory
RUN mkdir -p /app/server/data

WORKDIR /app/server

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3001

# Seed and start
ENTRYPOINT ["/bin/sh", "./start.sh"]
