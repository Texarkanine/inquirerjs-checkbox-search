# Custom Docker image for VHS demo recording
# Extends official VHS image with Node.js to run actual examples

FROM ghcr.io/charmbracelet/vhs:v0.10

# Install Node.js
RUN echo "deb http://deb.debian.org/debian bookworm main" > /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian bookworm-updates main" >> /etc/apt/sources.list && \
    echo "deb http://security.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list && \
    apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
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
