# Custom Docker image for VHS demo recording
# Extends Node.js with VHS installed to record actual examples

FROM node:18-slim

# Install system dependencies needed for VHS
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    ffmpeg \
    chromium \
    fonts-liberation \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install VHS from GitHub releases
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then VHS_ARCH="x86_64"; \
    elif [ "$ARCH" = "arm64" ]; then VHS_ARCH="arm64"; \
    else VHS_ARCH="x86_64"; fi && \
    wget -O /tmp/vhs.tar.gz "https://github.com/charmbracelet/vhs/releases/latest/download/vhs_Linux_${VHS_ARCH}.tar.gz" && \
    tar -xzf /tmp/vhs.tar.gz -C /tmp && \
    mv /tmp/vhs /usr/local/bin/vhs && \
    chmod +x /usr/local/bin/vhs && \
    rm -rf /tmp/vhs.tar.gz /tmp/vhs

# Set working directory
WORKDIR /workspace

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Ensure VHS can find our built files
ENV PATH="/workspace/node_modules/.bin:$PATH"

# Set environment variables for headless operation
ENV DISPLAY=:99
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Default command runs VHS with the provided tape file
ENTRYPOINT ["vhs"] 