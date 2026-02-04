# Use Node.js 20 for building and running the Astro app
FROM node:lts-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Astro app
RUN pnpm run build

# Expose port 4321 (Astro's default)
EXPOSE 4321

# Set environment to production
ENV HOST=0.0.0.0
ENV PORT=4321

# Start the Node.js server
CMD ["node", "./dist/server/entry.mjs"]
