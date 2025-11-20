#!/bin/bash
# Quick setup script for Watcher Agent Installation

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  Watcher Agent Installation Script         ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"

# Ask for configuration
echo ""
echo -e "${YELLOW}Please provide the following information:${NC}"
echo ""

read -p "Agent Name (e.g., prod-server-1): " AGENT_NAME
read -p "Watcher Server URL (e.g., http://your-server:3000): " SERVER_URL
read -p "Agent ID (from dashboard registration): " AGENT_ID
read -p "API Key (from dashboard registration): " API_KEY
read -p "Secret (from dashboard registration): " SECRET

# Application monitoring configuration
echo ""
echo -e "${YELLOW}Configure applications to monitor${NC}"
echo "Format: name:port:processName"
echo "Example: myapp:3000:node,api:3001:node"
echo ""
read -p "Applications to monitor: " MONITOR_APPS

# Create .env file
echo ""
echo "Creating .env file..."

cat > .env << EOF
WATCHER_SERVER_URL=${SERVER_URL}
AGENT_ID=${AGENT_ID}
API_KEY=${API_KEY}
SECRET=${SECRET}
AGENT_NAME=${AGENT_NAME}
MONITOR_APPS=${MONITOR_APPS}
EOF

echo -e "${GREEN}✓ .env file created${NC}"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

echo ""
echo -e "${GREEN}✓ Installation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test the agent: npm run dev"
echo "2. For production, build: npm run build"
echo "3. Setup systemd service (see README.md)"
echo ""
