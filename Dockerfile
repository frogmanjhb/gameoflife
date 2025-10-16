# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Ensure database files are copied (fallback)
RUN mkdir -p /app/server/dist/database
RUN cp /app/server/src/database/*.sql /app/server/dist/database/ 2>/dev/null || echo "No SQL files to copy"

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
