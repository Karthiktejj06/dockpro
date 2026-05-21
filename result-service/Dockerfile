FROM node:18-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5003

# Run Node application
CMD ["npm", "start"]
