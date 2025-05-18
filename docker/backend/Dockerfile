# docker/backend/Dockerfile
# Backend Dockerfile for development
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install global dependencies
RUN npm install -g nodemon ts-node

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Start development server
CMD ["npm", "run", "dev"]