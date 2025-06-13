# Custom Docker image for VHS demo recording
# Extends official VHS image with Node.js to run actual examples

FROM ghcr.io/charmbracelet/vhs:latest

# Install Node.js 18
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

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

# Default command runs VHS with the provided tape file
ENTRYPOINT ["vhs"] 