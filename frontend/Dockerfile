# Stage 1: Build React/Vite application
FROM node:20-alpine as build
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build (transpile React into raw HTML/CSS/JS)
COPY . .
RUN npm run build

# Stage 2: Serve application using Nginx (lightweight web server)
FROM nginx:alpine
# Remove default nginx configuration and copy built code
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
