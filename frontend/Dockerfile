FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Browser requests use the same HTTPS origin and are proxied by Nginx.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build the React app
RUN npm run build

# Production stage with Nginx
FROM nginx:1.27-alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Serve the React app over TLS and proxy API calls to the private backend.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
