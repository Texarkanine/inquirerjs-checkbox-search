# Custom Docker image for VHS demo recording
# Extends Node.js with VHS installed to record actual examples

FROM node:18-slim

# Install system dependencies needed for VHS
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    ttyd \
    && rm -rf /var/lib/apt/lists/*

# Install VHS
RUN curl -fsSL https://vhs.charm.sh | bash

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

# Default command runs VHS with the provided tape file
ENTRYPOINT ["vhs"] 