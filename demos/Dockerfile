# Custom Docker image for VHS demo recording
# Extends official VHS image with Node.js to run actual examples

FROM ghcr.io/charmbracelet/vhs:latest

# Install Node.js LTS directly from official binaries
ARG NODE_VERSION=v22.19.0
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (need dev deps to run VHS)
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Default command runs VHS with the provided tape file
ENTRYPOINT ["vhs"]
