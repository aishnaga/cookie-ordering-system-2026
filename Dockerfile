FROM node:20-slim

WORKDIR /app

# Copy package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY client ./client
COPY server ./server

# Build frontend
RUN cd client && npm run build

# Create data directory
RUN mkdir -p /app/server/data

WORKDIR /app/server

EXPOSE 3001

CMD ["node", "src/index.js"]
