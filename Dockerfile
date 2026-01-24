FROM node:20-slim

WORKDIR /app

# Copy everything
COPY . .

# Install client dependencies and build
WORKDIR /app/client
RUN npm install && npm run build

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Create data directory
RUN mkdir -p /app/server/data

EXPOSE 3001

CMD ["node", "src/index.js"]
