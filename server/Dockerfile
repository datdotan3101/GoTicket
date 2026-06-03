FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose port 5000 for the application
EXPOSE 5000

# Start the server
CMD ["npm", "run", "start"]
