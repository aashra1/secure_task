FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Create non-root user for security (optional but recommended)
RUN addgroup -S securetask && adduser -S securetask -G securetask && \
    mkdir -p /app/logs && chown -R securetask:securetask /app

# Switch to non-root user
USER securetask

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "src/app.js"]