# Use Node.js 20 (non-alpine to avoid rollup musl issues)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install root dependencies
RUN npm ci --legacy-peer-deps || npm install

# Install server dependencies
RUN cd server && npm ci --legacy-peer-deps || npm install

# Install client dependencies - fix rollup optional deps bug
RUN cd client && rm -rf node_modules package-lock.json && npm install

# Copy source code
COPY . .

# Reinstall client deps after COPY . . (COPY overwrites lockfiles from host)
# Fix npm optional-deps bug for rollup native bindings by regenerating lockfile in Linux
RUN cd client \
  && rm -rf node_modules package-lock.json \
  && npm install --include=optional \
  && npm install --no-save @rollup/rollup-linux-x64-gnu

# Build the application
RUN npm run build

# Ensure database files are copied (fallback)
RUN mkdir -p /app/server/dist/database
RUN cp /app/server/src/database/*.sql /app/server/dist/database/ 2>/dev/null || echo "No SQL files to copy"

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
